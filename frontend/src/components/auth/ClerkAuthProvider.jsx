import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/ui/themes";

const appearance = {
  theme: dark,
  captcha: { theme: "dark" },
  variables: {
    colorPrimary: "#ef4444",
    colorBackground: "#0D131F",
    colorInput: "#080E18",
    fontFamily: "Geist, sans-serif",
    borderRadius: "8px",
  },
};

// The Clerk dev instance is named "My Application"; override the visible copy so the
// sign-in screen stays on-brand until the application name is changed in the dashboard.
const localization = {
  signIn: {
    start: { title: "Welcome to Obsidian Vane", titleCombined: "Welcome to Obsidian Vane" },
  },
  signUp: {
    start: { title: "Create your Obsidian Vane account" },
  },
};

const BACKEND_URL = "";

// "loading" → keep the public shell on screen; "off" → static demo (no Clerk);
// "ready" → Clerk is mounted and its hooks are safe to call.
export const ClerkStatusContext = createContext("loading");
export const useClerkStatus = () => useContext(ClerkStatusContext);

export default function ClerkAuthProvider({ children }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (import.meta.env.VITE_STATIC_DEMO === "true") {
      setUnavailable(true);
      return;
    }
    let cancelled = false;
    let retry = null;
    const load = async (attempt = 0) => {
      // Never let a stalled request hold the landing page hostage.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      try {
        const res = await fetch(`${BACKEND_URL}/api/clerk/config`, { signal: ctrl.signal });
        const cfg = await res.json();
        if (cancelled) return;
        if (cfg.enabled) { setConfig(cfg); return; }
        // The backend answered and auth is switched off: no point retrying.
        setUnavailable(true);
        return;
      } catch {
        /* offline / cold start: retry below */
      } finally {
        clearTimeout(timer);
      }
      if (cancelled) return;
      if (attempt >= 8) { setUnavailable(true); return; }
      retry = setTimeout(() => load(attempt + 1), 1200);
    };
    load();
    return () => { cancelled = true; clearTimeout(retry); };
  }, []);

  // Render the public site immediately while Clerk boots (or is unavailable) instead
  // of a blank screen. The landing page is identical either way, so there is no flash
  // of the wrong content — signed-in users swap to the terminal once config arrives.
  if (unavailable || !config) {
    return <ClerkStatusContext.Provider value={unavailable ? "off" : "loading"}>{children}</ClerkStatusContext.Provider>;
  }
  return (
    <ClerkStatusContext.Provider value="ready">
      <ClerkProvider
        publishableKey={config.publishable_key}
        proxyUrl={config.proxy_url || undefined}
        appearance={appearance}
        localization={localization}
        routerPush={(to) => navigate(to)}
        routerReplace={(to) => navigate(to, { replace: true })}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        afterSignOutUrl="/"
      >
        {children}
      </ClerkProvider>
    </ClerkStatusContext.Provider>
  );
}
