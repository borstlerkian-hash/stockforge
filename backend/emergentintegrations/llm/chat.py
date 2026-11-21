"""Drop-in replacement for the unavailable `emergentintegrations` package.

StockForge only imports four names from it:

    LlmChat(api_key=..., session_id=..., system_message=...).with_model(provider, model)
    chat.stream_message(UserMessage(text=...))  -> yields TextDelta / StreamDone
    chat.send_message(UserMessage(text=...))    -> returns str

This implementation talks to any OpenAI-compatible ``/chat/completions`` endpoint:

    LLM_BASE_URL  base URL            (default: https://api.openai.com/v1)
    LLM_MODEL     model id, overrides the model requested via with_model()
    LLM_API_KEY   fallback key when the caller passes an empty api_key

The app itself passes the key from EMERGENT_LLM_KEY, so setting that env var
(and optionally LLM_BASE_URL / LLM_MODEL) is enough to light up every AI route.
Missing config raises a clear RuntimeError at request time, which the app turns
into a friendly "AI unavailable" message — the admin panel never depends on it.
"""

from __future__ import annotations

import os
from typing import AsyncGenerator, Optional

import httpx

DEFAULT_BASE_URL = "https://api.openai.com/v1"
CONNECT_TIMEOUT = 15.0
READ_TIMEOUT = 180.0


class UserMessage:
    def __init__(self, text: str = ""):
        self.text = text


class TextDelta:
    def __init__(self, content: str = ""):
        self.content = content


class StreamDone:
    """Marks the end of a stream (the app breaks out of the loop on it)."""


class LlmChat:
    def __init__(self, api_key: str = "", session_id: str = "", system_message: str = ""):
        self.api_key = api_key
        self.session_id = session_id
        self.system_message = system_message
        # server.py assigns chat.sf_system after construction
        self.sf_system = system_message
        self.provider = ""
        self.model = ""

    def with_model(self, provider: str, model: str) -> "LlmChat":
        self.provider = provider
        self.model = model
        return self

    # --- configuration -----------------------------------------------------
    def _config(self) -> tuple[str, str, str]:
        key = self.api_key or os.environ.get("LLM_API_KEY", "")
        if not key:
            raise RuntimeError(
                "AI is not configured on this server (no API key: set EMERGENT_LLM_KEY)."
            )
        base = os.environ.get("LLM_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
        model = os.environ.get("LLM_MODEL") or self.model
        if not model:
            raise RuntimeError("AI is not configured on this server (no model: set LLM_MODEL).")
        return key, base, model

    def _payload(self, text: str, stream: bool) -> dict:
        _, _, model = self._config()
        messages = []
        system = self.sf_system or self.system_message
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": text})
        payload = {"model": model, "messages": messages, "stream": stream}
        if stream:
            payload["stream_options"] = {"include_usage": False}
        return payload

    @staticmethod
    def _headers(key: str) -> dict:
        return {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    @staticmethod
    def _raise_for_status(resp: httpx.Response) -> None:
        if resp.status_code >= 400:
            body = resp.text[:300]
            raise RuntimeError(f"LLM endpoint returned HTTP {resp.status_code}: {body}")

    # --- public API --------------------------------------------------------
    async def send_message(self, message: UserMessage) -> str:
        key, base, _ = self._config()
        timeout = httpx.Timeout(READ_TIMEOUT, connect=CONNECT_TIMEOUT)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{base}/chat/completions",
                headers=self._headers(key),
                json=self._payload(message.text, stream=False),
            )
        self._raise_for_status(resp)
        data = resp.json()
        try:
            return data["choices"][0]["message"].get("content") or ""
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected LLM response shape: {str(data)[:300]}") from e

    async def stream_message(self, message: UserMessage) -> AsyncGenerator[object, None]:
        key, base, _ = self._config()
        timeout = httpx.Timeout(READ_TIMEOUT, connect=CONNECT_TIMEOUT)
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                f"{base}/chat/completions",
                headers=self._headers(key),
                json=self._payload(message.text, stream=True),
            ) as resp:
                self._raise_for_status(resp)
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        import json as _json

                        obj = _json.loads(data)
                    except ValueError:
                        continue
                    choices = obj.get("choices") or []
                    if not choices:
                        continue
                    delta = choices[0].get("delta") or {}
                    content = delta.get("content")
                    if content:
                        yield TextDelta(content)
        yield StreamDone()
