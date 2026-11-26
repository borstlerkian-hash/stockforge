import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine, ArrowRight, ArrowUpFromLine, BadgeCheck, CircleCheck, CreditCard, FileCheck2,
  Info, LockKeyhole, ShieldCheck, TrendingUp, X, Zap,
} from "lucide-react";
import { fmtUsd, useForgeApi, type CardCheckout, type Wallet, type WalletTxn } from "@/lib/forge";
import { useSF } from "@/context/SFContext";

const QUICK = [1000, 5000, 10000, 50000];
const CARD_QUICK = [100, 500, 1000, 5000];
const MAX = 1_000_000;
const CARD_MIN_FALLBACK = 5;
const CARD_MAX_FALLBACK = 25_000;

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onFunds: () => void; // refresh the account (cash/equity) after a deposit or withdrawal
}

type Tab = "instant" | "card" | "withdraw";

export default function DepositDialog({ open, onClose, onFunds }: DepositDialogProps) {
  const api = useForgeApi();
  const qc = useQueryClient();
  const { me, can, setPage } = useSF() as unknown as {
    me?: { email?: string } | null;
    can: (gate: string) => boolean;
    setPage: (page: string) => void;
  };
  const [tab, setTab] = useState<Tab>("instant");
  const [amount, setAmount] = useState("10000");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<WalletTxn | null>(null);

  const w = useQuery({ queryKey: ["wallet"], queryFn: () => api.get<Wallet>("/wallet"), enabled: open });
  const wallet = w.data && !w.isError ? w.data : undefined;
  const cardReady = wallet?.card_enabled === true;
  const cardMode = wallet?.card_mode ?? "off";
  const cardMin = wallet?.card_min ?? CARD_MIN_FALLBACK;
  const cardMax = wallet?.card_max ?? CARD_MAX_FALLBACK;

  // When a card processor is connected, make the real funding path the first thing members see.
  useEffect(() => {
    if (cardReady) setTab("card");
  }, [cardReady]);

  const done = async (msg: string) => {
    toast.success(msg);
    await qc.invalidateQueries({ queryKey: ["wallet"] });
    onFunds();
  };

  const submit = async () => {
    const n = Number(amount);
    if (tab === "card") {
      if (!cardReady) return toast.error("Card payments aren't enabled yet");
      if (!Number.isFinite(n) || n < cardMin) return toast.error(`Minimum card deposit is ${fmtUsd(cardMin, 0)}`);
      if (n > cardMax) return toast.error(`Maximum card deposit is ${fmtUsd(cardMax, 0)}`);
    } else {
      if (!Number.isFinite(n) || n <= 0) return toast.error("Enter an amount above $0");
      if (n > MAX) return toast.error(`Maximum per transfer is ${fmtUsd(MAX, 0)}`);
      if (tab === "withdraw" && wallet && n > wallet.cash + 1e-6) return toast.error("Withdrawal exceeds available cash");
    }
    setBusy(true);
    try {
      if (tab === "instant") {
        const r = await api.post<{ txn: WalletTxn }>("/wallet/deposit", { amount: n });
        setReceipt(r.txn);
        await done(`${fmtUsd(n, 0)} credited to buying power`);
      } else if (tab === "withdraw") {
        const r = await api.post<{ txn: WalletTxn }>("/wallet/withdraw", { amount: n });
        setReceipt(r.txn);
        await done(`${fmtUsd(n, 0)} withdrawal processed`);
      } else {
        const r = await api.post<CardCheckout>("/wallet/card/checkout", { amount: n, origin_url: window.location.origin });
        window.location.href = r.checkout_url;
        return;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (id: Tab) => { setTab(id); setReceipt(null); };
  const openInvesting = () => {
    onClose();
    setPage(can("paper") ? "trade" : "tiers");
  };

  const TabBtn = ({ id, icon, label, disabled }: { id: Tab; icon: React.ReactNode; label: string; disabled?: boolean }) => (
    <button
      onClick={() => switchTab(id)}
      disabled={disabled}
      title={disabled ? "Card payments are not enabled yet" : undefined}
      data-testid={`deposit-tab-${id}`}
      role="tab"
      aria-selected={tab === id}
      className={`flex-1 font-mono text-[11px] tracking-widest uppercase py-2.5 border flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${
        tab === id ? "border-[var(--a)] text-white bg-[var(--a-soft)]" : "border-white/10 text-neutral-400 hover:text-white"
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] grid place-items-center bg-black/75 backdrop-blur-sm p-3"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          data-testid="deposit-overlay"
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label="Deposit funds"
            className="relative w-full max-w-lg sf-panel !bg-[#0B0F19] p-5 max-h-[92vh] overflow-y-auto"
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            data-testid="deposit-dialog"
          >
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <p className="kicker flex items-center gap-2"><ShieldCheck size={13} /> VANE WALLET</p>
                <h3 className="font-disp text-2xl font-bold mt-1">Fund your account</h3>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  Buying power <b className="text-white" data-testid="deposit-cash">{wallet ? fmtUsd(wallet.cash) : "—"}</b>
                  <span className="mx-2 text-neutral-700">·</span>
                  deposited {wallet ? fmtUsd(wallet.deposits_total, 0) : "—"}
                </p>
              </div>
              <button className="sf-btn sf-btn-sm" onClick={onClose} aria-label="Close" data-testid="deposit-close-button"><X size={14} /></button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="sf-pill flex items-center gap-1"><BadgeCheck size={11} /> VERIFIED SESSION</span>
              <span className="sf-pill flex items-center gap-1"><LockKeyhole size={11} /> ENCRYPTED</span>
              <span className="font-mono text-[10px] text-neutral-600 ml-auto">LEDGER · {receipt?.ref || "READY"}</span>
            </div>

            <div className="flex gap-1 mb-4" role="tablist">
              <TabBtn id="instant" icon={<Zap size={12} />} label="Practice" />
              <TabBtn id="card" icon={<CreditCard size={12} />} label="Card / Wallet" disabled={wallet ? !cardReady : false} />
              <TabBtn id="withdraw" icon={<ArrowUpFromLine size={12} />} label="Transfer out" />
            </div>

            {receipt && tab !== "card" && (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3" data-testid="deposit-receipt">
                <div className="flex items-center gap-2">
                  <CircleCheck size={16} className="text-emerald-400" />
                  <p className="font-mono text-xs font-bold text-emerald-300">
                    {tab === "withdraw" ? "Transfer recorded" : "Deposit recorded"}
                  </p>
                  <span className="ml-auto font-mono text-[10px] text-neutral-500">{new Date(receipt.t).toLocaleTimeString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 font-mono text-[11px] text-neutral-400">
                  <span>Reference</span><span className="text-right text-white">{receipt.ref || receipt.id.slice(0, 8).toUpperCase()}</span>
                  <span>Amount</span><span className={`text-right ${receipt.amount >= 0 ? "bull" : "bear"}`}>{receipt.amount >= 0 ? "+" : ""}{fmtUsd(receipt.amount, 0)}</span>
                  <span>New balance</span><span className="text-right text-white">{fmtUsd(receipt.balance)}</span>
                </div>
                <button className="sf-btn sf-btn-sm w-full mt-3" onClick={openInvesting} data-testid="deposit-invest-button">
                  <TrendingUp size={13} /> {can("paper") ? "Invest these funds" : "See investing tiers"} <ArrowRight size={13} />
                </button>
              </div>
            )}

            {tab !== "card" ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-400 flex gap-2">
                  <Info size={14} className="shrink-0 mt-0.5 text-neutral-500" />
                  {tab === "instant"
                    ? "Practice credit adds simulated buying power to your trading account. No payment is taken."
                    : "Move simulated cash out of your buying power. This is a ledger entry, not a bank transfer."}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q} onClick={() => setAmount(String(q))} data-testid={`deposit-quick-${q}`}
                      className={`font-mono text-xs py-2 border transition-colors duration-150 ${
                        Number(amount) === q ? "border-[var(--a)] text-white bg-[var(--a-soft)]" : "border-white/10 text-neutral-400 hover:text-white"
                      }`}
                    >
                      ${q >= 1000 ? `${q / 1000}k` : q}
                    </button>
                  ))}
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] text-neutral-500 tracking-widest">AMOUNT (USD)</span>
                  <input
                    className="sf-input w-full mt-1 !text-lg" type="number" min="1" max={MAX} step="any"
                    value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="deposit-amount-input"
                  />
                </label>
                <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500 border-t border-white/5 pt-3">
                  <span>{tab === "withdraw" ? "Balance after transfer" : "Buying power after credit"}</span>
                  <span className="text-white">
                    {fmtUsd((wallet?.cash ?? 0) + (tab === "withdraw" ? -1 : 1) * (Number(amount) || 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!cardReady ? (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-200/80">
                    Card payments are not enabled yet. Use <b>Practice</b> for simulated buying power, or ask the admin to connect Stripe.
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-neutral-500">PAYMENT METHOD</span>
                        <span className="sf-pill flex items-center gap-1">
                          <LockKeyhole size={10} /> {cardMode === "test" ? "TEST MODE" : "STRIPE SECURE"}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-300 mt-2">
                        Card or supported wallet. You'll finish on Stripe's hosted checkout.
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2 font-mono text-[9px] text-neutral-500">
                        {["VISA", "MASTERCARD", "AMEX", "APPLE PAY", "GOOGLE PAY"].map((method) => (
                          <span key={method} className="border border-white/10 px-1.5 py-1">{method}</span>
                        ))}
                      </div>
                    </div>
                    {cardMode === "test" && (
                      <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3 text-xs text-sky-200/80">
                        Test mode is active. Use card <b className="font-mono text-white">4242 4242 4242 4242</b>,
                        any future date and CVC. No real money moves.
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {CARD_QUICK.map((q) => (
                        <button
                          key={q} onClick={() => setAmount(String(q))} data-testid={`card-quick-${q}`}
                          className={`font-mono text-xs py-2 border transition-colors duration-150 ${
                            Number(amount) === q ? "border-[var(--a)] text-white bg-[var(--a-soft)]" : "border-white/10 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {fmtUsd(q, 0)}
                        </button>
                      ))}
                    </div>
                    <label className="block">
                      <span className="font-mono text-[10px] text-neutral-500 tracking-widest">AMOUNT TO ADD (USD)</span>
                      <input
                        className="sf-input w-full mt-1 !text-lg" type="number" min={cardMin} max={cardMax} step="any"
                        value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="card-amount-input"
                      />
                    </label>
                    <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500 border-t border-white/5 pt-3">
                      <span>Credited after payment</span>
                      <span className="text-white">{fmtUsd(Number(amount) || 0, 0)}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500">
                      Practice credits only. No cash value, no securities are purchased, and this is not investment advice.
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              className="sf-btn sf-btn-p w-full !py-3 mt-4"
              onClick={submit}
              disabled={busy || (tab === "card" && !cardReady)}
              data-testid="deposit-submit-btn"
            >
              {tab === "withdraw" ? <ArrowUpFromLine size={14} /> : tab === "card" ? <CreditCard size={14} /> : <ArrowDownToLine size={14} />}
              {busy
                ? "Processing…"
                : tab === "withdraw"
                  ? `Transfer out ${fmtUsd(Number(amount) || 0, 0)}`
                  : tab === "card"
                    ? "Continue to secure checkout"
                    : `Deposit ${fmtUsd(Number(amount) || 0, 0)}`}
            </button>

            {!receipt && (
              <button className="sf-btn w-full mt-2 !py-2.5" onClick={openInvesting} data-testid="deposit-invest-link">
                <TrendingUp size={14} /> {can("paper") ? "Open investing desk" : "Explore investing tiers"} <ArrowRight size={13} />
              </button>
            )}

            <div className="mt-5">
              <div className="lab flex items-center gap-2"><FileCheck2 size={13} /> RECENT ACTIVITY</div>
              <div className="max-h-40 overflow-y-auto space-y-1" data-testid="wallet-txns">
                {(wallet?.txns ?? []).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 font-mono text-xs py-1 border-b border-white/5">
                    <span className="text-neutral-600 w-20">{new Date(t.t).toLocaleDateString()}</span>
                    <span className="flex-1 text-neutral-400 truncate">
                      {t.note} {t.ref && <span className="text-neutral-600">· {t.ref}</span>}
                    </span>
                    <span className={t.amount >= 0 ? "bull" : "bear"}>{t.amount >= 0 ? "+" : ""}{fmtUsd(t.amount, 0)}</span>
                  </div>
                ))}
                {wallet && !wallet.txns.length && <p className="font-mono text-xs text-neutral-600">No transfers yet.</p>}
              </div>
            </div>

            <p className="font-mono text-[9px] leading-relaxed text-neutral-600 mt-4 border-t border-white/5 pt-3">
              {me?.email ? `Account ${me.email} · ` : ""}Every credit is recorded once in your ledger. Simulated funds are for practice only — not investment advice.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
