import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fmtUsd, publicFetch, useForgeApi, type Funding, type PayStatus } from "@/lib/forge";

// Hosted checkouts return here. Poll the status endpoint (which also credits the
// practice balance once payment is confirmed), then hand the user back.
export default function PaymentReturn({ ok }: { ok: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const api = useForgeApi();
  const sid = params.get("session_id");
  const fid = params.get("funding_id");
  const token = params.get("token");
  const [state, setState] = useState<"checking" | "paid" | "failed" | "cancelled">(ok ? "checking" : "cancelled");
  const [amount, setAmount] = useState<number | undefined>();
  const tries = useRef(0);

  useEffect(() => {
    if (!ok) return;
    let stop = false;

    const tick = async () => {
      try {
        if (fid) {
          const f = await api.post<Funding>(`/funding/${fid}/confirm`, { token: token || undefined });
          setAmount(f.amount);
          if (f.credited || f.status === "approved") return !stop && setState("paid");
          if (["rejected", "expired", "failed"].includes(f.status)) return !stop && setState("failed");
        } else if (sid) {
          // Legacy Stripe sessions still settle through the public status route.
          const s = await publicFetch<PayStatus>(`/payments/status/${sid}`);
          setAmount(s.amount);
          if (s.payment_status === "paid") return !stop && setState("paid");
          if (s.payment_status === "expired" || s.payment_status === "failed") return !stop && setState("failed");
        }
      } catch { /* keep polling */ }
      if (++tries.current < 18 && !stop) setTimeout(tick, 2000);
      else if (!stop) setState("failed");
    };

    tick();
    return () => { stop = true; };
  }, [ok, sid, fid, token, api]);

  useEffect(() => {
    if (state === "paid" || state === "cancelled") {
      const id = setTimeout(() => navigate("/", { replace: true }), 2600);
      return () => clearTimeout(id);
    }
  }, [state, navigate]);

  const msg = {
    checking: ["CONFIRMING PAYMENT", "Talking to your payment provider — this takes a few seconds."],
    paid: ["DEPOSIT CONFIRMED", `${amount ? fmtUsd(amount, 0) : "Your practice credits"} added to your buying power. Returning to the terminal…`],
    failed: ["PAYMENT NOT CONFIRMED", "We couldn't confirm this payment. No funds were added."],
    cancelled: ["CHECKOUT CANCELLED", "No charge was made. Returning to the terminal…"],
  }[state];

  return (
    <div className="min-h-screen grid place-items-center bg-[#07090E] px-4" data-testid="payment-return-page">
      <div className="sf-panel p-8 max-w-md w-full text-center">
        <p className={`font-mono text-[11px] tracking-[0.3em] ${state === "paid" ? "bull" : state === "failed" ? "bear" : "accent"}`} data-testid="payment-return-status">{msg[0]}</p>
        <p className="text-neutral-300 mt-3" data-testid="payment-return-message">{msg[1]}</p>
        {state === "checking" && <div className="boot-bar h-[2px] bg-white/5 mt-6"><i /></div>}
        <button className="sf-btn sf-btn-p mt-6" onClick={() => navigate("/", { replace: true })} data-testid="payment-return-home-button">Back to terminal</button>
      </div>
    </div>
  );
}
