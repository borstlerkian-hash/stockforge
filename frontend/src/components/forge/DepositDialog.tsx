import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownToLine, ArrowRight, ArrowUpFromLine, BadgeCheck, Bitcoin, Check, CircleCheck, Copy,
  CreditCard, ExternalLink, FileCheck2, Info, Landmark, Loader2, LockKeyhole, RefreshCw, ShieldCheck,
  TrendingUp, Wallet as WalletIcon, X, Zap,
} from "lucide-react";
import {
  fmtUsd, useForgeApi, type Funding, type FundingMethods, type FundingProvider, type Wallet, type WalletTxn,
} from "@/lib/forge";
import { useSF } from "@/context/SFContext";

const PRACTICE_QUICK = [1000, 5000, 10000, 50000];
const FUND_QUICK = [100, 500, 1000, 5000];
const MAX = 1_000_000;
const FUND_MIN_FALLBACK = 5;
const FUND_MAX_FALLBACK = 25_000;
const TXID_RE = /^[0-9a-fA-F]{64}$/;

type Tab = "instant" | "fund" | "withdraw";

const PROVIDER_META: Record<FundingProvider, { label: string; sub: string; icon: ReactNode }> = {
  paypal: { label: "PayPal", sub: "Balance · bank · card", icon: <WalletIcon size={16} /> },
  square: { label: "Square", sub: "Card · Apple Pay · Google Pay", icon: <CreditCard size={16} /> },
  bitcoin: { label: "Bitcoin", sub: "On-chain BTC transfer", icon: <Bitcoin size={16} /> },
  bank: { label: "Bank transfer", sub: "Manual admin review", icon: <Landmark size={16} /> },
};

const isCredited = (f: Funding | null) => Boolean(f?.credited) || f?.status === "approved";
const isOpenFunding = (f: Funding | null) => !!f && !isCredited(f) && !["rejected", "expired", "failed"].includes(f.status);

const secondsLeft = (until: string) => Math.max(0, Math.floor((new Date(until).getTime() - Date.now()) / 1000));

function Countdown({ until }: { until: string }) {
  const [seconds, setSeconds] = useState(() => secondsLeft(until));
  useEffect(() => {
    const id = setInterval(() => setSeconds(secondsLeft(until)), 1000);
    return () => clearInterval(id);
  }, [until]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <span className={`font-mono text-sm tabular-nums ${seconds < 120 ? "bear" : "text-amber-400"}`} data-testid="fund-btc-timer">
      {seconds > 0 ? `${mm}:${ss}` : "EXPIRED"}
    </span>
  );
}

function CopyRow({ label, value, testid }: { label: string; value: string; testid: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success(`${label} copied`);
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  };
  return (
    <div className="space-y-1">
      <div className="lab !mb-0">{label}</div>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 min-w-0 break-all sf-input !py-2 !text-[13px] select-all" data-testid={testid}>{value}</code>
        <button className="sf-btn sf-btn-sm !min-h-[44px] !min-w-[44px] !px-0" onClick={copy} aria-label={`Copy ${label}`} data-testid={`${testid}-copy`}>
          {done ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onFunds: () => void;
}

export default function DepositDialog({ open, onClose, onFunds }: DepositDialogProps) {
  const api = useForgeApi();
  const qc = useQueryClient();
  const sf = useSF() as { me?: any; can: (gate: string) => boolean; setPage: (page: string) => void } | null;
  const me = sf?.me;
  const can = sf?.can ?? (() => false);
  const setPage = sf?.setPage ?? (() => {});

  const [tab, setTab] = useState<Tab>("instant");
  const [amount, setAmount] = useState("10000");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<WalletTxn | null>(null);
  const [provider, setProvider] = useState<FundingProvider>("paypal");
  const [funding, setFunding] = useState<Funding | null>(null);
  const [txid, setTxid] = useState("");
  const [bankNote, setBankNote] = useState("");
  const [err, setErr] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const walletQ = useQuery({ queryKey: ["wallet"], queryFn: () => api.get<Wallet>("/wallet"), enabled: open });
  const methodsQ = useQuery({ queryKey: ["funding-methods"], queryFn: () => api.get<FundingMethods>("/funding/methods"), enabled: open });
  const wallet = walletQ.data && !walletQ.isError ? walletQ.data : undefined;
  const methods = methodsQ.data?.methods ?? [];
  const enabledMethods = methods.filter((m) => m.enabled);
  const enabledKey = enabledMethods.map((m) => m.id).join(",");
  const firstEnabled = enabledMethods[0]?.id;
  const activeProvider = enabledMethods.find((m) => m.id === provider)?.id ?? firstEnabled;
  const visibleMethods = me?.is_admin ? methods : enabledMethods;
  const fundMin = methodsQ.data?.min ?? FUND_MIN_FALLBACK;
  const fundMax = methodsQ.data?.max ?? FUND_MAX_FALLBACK;

  useEffect(() => {
    if (firstEnabled && !enabledKey.split(",").includes(provider)) setProvider(firstEnabled);
  }, [enabledKey, firstEnabled, provider]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const done = async (msg: string) => {
    toast.success(msg);
    await qc.invalidateQueries({ queryKey: ["wallet"] });
    onFunds();
  };

  const switchTab = (id: Tab) => {
    setTab(id);
    setReceipt(null);
    setFunding(null);
    setTxid("");
    setBankNote("");
    setErr("");
    setAmount(id === "instant" ? "10000" : "100");
  };

  const submit = async () => {
    const n = Number(amount);
    if (tab === "fund") {
      if (!activeProvider) return toast.error("No funding methods are enabled yet");
      if (!Number.isFinite(n) || n < fundMin) return toast.error(`Minimum deposit is ${fmtUsd(fundMin, 0)}`);
      if (n > fundMax) return toast.error(`Maximum deposit is ${fmtUsd(fundMax, 0)}`);
      setBusy(true);
      setErr("");
      try {
        const r = await api.post<Funding>("/funding/checkout", {
          provider: activeProvider, amount: n, origin_url: window.location.origin,
        });
        if (r.redirect_url) {
          window.location.href = r.redirect_url;
          return;
        }
        setFunding(r);
        setAmount(String(r.amount));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not start funding";
        setErr(msg);
        toast.error(msg);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!Number.isFinite(n) || n <= 0) return toast.error("Enter an amount above $0");
    if (n > MAX) return toast.error(`Maximum per transfer is ${fmtUsd(MAX, 0)}`);
    if (tab === "withdraw" && wallet && n > wallet.cash + 1e-6) return toast.error("Withdrawal exceeds available cash");
    setBusy(true);
    try {
      if (tab === "instant") {
        const r = await api.post<{ txn: WalletTxn }>("/wallet/deposit", { amount: n });
        setReceipt(r.txn);
        await done(`${fmtUsd(n, 0)} credited to buying power`);
      } else {
        const r = await api.post<{ txn: WalletTxn }>("/wallet/withdraw", { amount: n });
        setReceipt(r.txn);
        await done(`${fmtUsd(n, 0)} withdrawal processed`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const verifyBitcoin = async () => {
    if (!funding) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.post<Funding>(`/funding/${funding.id}/bitcoin/verify`, { txid: txid.trim() });
      setFunding(r);
      if (isCredited(r)) await done(`${fmtUsd(r.amount, 0)} credited to buying power`);
      else if (r.status === "seen") toast("Seen on-chain. Tap Check again after one confirmation.");
      else if (r.underpaid) toast.warning("Payment seen but below the quoted amount. The admin will review it.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not verify that transaction";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const bankSent = async () => {
    if (!funding) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.post<Funding>(`/funding/${funding.id}/bank/sent`, { note: bankNote });
      setFunding(r);
      toast.success("Transfer marked as sent. The admin will review it.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update the request";
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const openInvesting = () => {
    onClose();
    setPage(can("paper") ? "trade" : "tiers");
  };

  const TabBtn = ({ id, icon, label }: { id: Tab; icon: ReactNode; label: string }) => (
    <button
      onClick={() => switchTab(id)}
      data-testid={`deposit-tab-${id}`}
      role="tab"
      aria-selected={tab === id}
      className={`flex-1 min-h-[44px] font-mono text-[11px] tracking-[0.12em] uppercase py-2.5 border flex items-center justify-center gap-2 transition-colors duration-150 ${
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
            ref={dialogRef} tabIndex={-1}
            role="dialog" aria-modal="true" aria-labelledby="deposit-title"
            className="relative w-full max-w-lg sf-panel !bg-[#0B0F19] p-5 max-h-[92vh] overflow-y-auto"
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            data-testid="deposit-dialog"
          >
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 id="deposit-title" className="font-disp text-2xl font-bold flex items-center gap-2"><ShieldCheck size={16} className="accent" /> Fund your account</h3>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  Buying power <b className="text-white" data-testid="deposit-cash">{wallet ? fmtUsd(wallet.cash) : "—"}</b>
                  <span className="mx-2 text-neutral-700">·</span>
                  deposited {wallet ? fmtUsd(wallet.deposits_total, 0) : "—"}
                </p>
              </div>
              <button className="sf-btn sf-btn-sm !min-h-[44px] !min-w-[44px] !px-0" onClick={onClose} aria-label="Close" data-testid="deposit-close-button"><X size={14} /></button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="sf-pill flex items-center gap-1"><BadgeCheck size={11} /> VERIFIED SESSION</span>
              <span className="sf-pill flex items-center gap-1"><LockKeyhole size={11} /> ENCRYPTED</span>
              <span className="font-mono text-[10px] text-neutral-600 ml-auto">LEDGER · {receipt?.ref || funding?.reference || "READY"}</span>
            </div>

            <div className="flex gap-1 mb-4" role="tablist">
              <TabBtn id="instant" icon={<Zap size={12} />} label="Practice" />
              <TabBtn id="fund" icon={<CreditCard size={12} />} label="Add funds" />
              <TabBtn id="withdraw" icon={<ArrowUpFromLine size={12} />} label="Transfer out" />
            </div>

            {receipt && tab !== "fund" && (
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

            {tab !== "fund" ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-400 flex gap-2">
                  <Info size={14} className="shrink-0 mt-0.5 text-neutral-500" />
                  {tab === "instant"
                    ? "Practice credit adds simulated buying power to your trading account. No payment is taken."
                    : "Move simulated cash out of your buying power. This is a ledger entry, not a bank transfer."}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {PRACTICE_QUICK.map((q) => (
                    <button
                      key={q} onClick={() => setAmount(String(q))} data-testid={`deposit-quick-${q}`}
                      className={`font-mono text-xs min-h-[44px] py-2 border transition-colors duration-150 ${
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
                {err && <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300" data-testid="fund-error">{err}</div>}
                {methodsQ.isLoading ? (
                  <div className="grid grid-cols-2 gap-2" data-testid="fund-methods-loading">{[0, 1, 2, 3].map((k) => <div key={k} className="sk h-16" />)}</div>
                ) : !visibleMethods.length ? (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-200/80">
                    No funding methods are enabled yet. Use <b>Practice</b> for simulated buying power.
                  </div>
                ) : funding ? (
                  <div className="space-y-3" data-testid="funding-detail">
                    {funding.provider === "bitcoin" && (
                      <>
                        <div className="rounded-xl border border-[#F7931A]/30 bg-[#1F1A12] p-3 flex items-end justify-between gap-3">
                          <div>
                            <div className="lab !mb-1 !text-[#F7931A]/80">SEND EXACTLY</div>
                            <p className="font-mono text-2xl font-bold text-[#F7931A]" data-testid="fund-btc-amount">{funding.amount_btc} BTC</p>
                            <p className="font-mono text-[11px] text-neutral-400 mt-1">
                              {fmtUsd(funding.amount, 0)} at {funding.btc_usd ? fmtUsd(Number(funding.btc_usd), 0) : "live rate"}/BTC · {funding.price_source}
                            </p>
                          </div>
                          {!funding.txid && <div className="text-right"><div className="lab !mb-1">QUOTE HOLDS</div>{funding.quote_expires_at && <Countdown until={funding.quote_expires_at} />}</div>}
                        </div>
                        <CopyRow label="Receiving address" value={funding.btc_address || ""} testid="fund-btc-address" />
                        <a className="sf-btn w-full" href={`bitcoin:${funding.btc_address}?amount=${funding.amount_btc}`} data-testid="fund-btc-wallet-link">
                          <Bitcoin size={14} /> Open in wallet app
                        </a>
                        {isOpenFunding(funding) && (
                          <div className="space-y-2">
                            <label className="lab !mb-0 block" htmlFor="fund-txid">Transaction ID (after you send)</label>
                            <input
                              id="fund-txid" className="sf-input w-full !text-xs" placeholder="64-character txid"
                              value={txid} onChange={(e) => setTxid(e.target.value)} disabled={!!funding.txid}
                              data-testid="fund-btc-txid-input"
                            />
                            <button className="sf-btn sf-btn-p w-full" onClick={verifyBitcoin} disabled={busy || !TXID_RE.test(txid.trim())} data-testid="fund-btc-verify">
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              {funding.txid ? "Check again" : "Verify payment"}
                            </button>
                            {funding.status === "seen" && (
                              <p className="text-xs text-neutral-400" data-testid="fund-btc-seen">
                                {funding.underpaid
                                  ? "Received less than quoted. The admin will review it."
                                  : "Seen on-chain. Your credits post after one confirmation. Tap Check again."}
                                {funding.txid && <a className="underline ml-1 inline-flex items-center gap-1" href={`https://mempool.space/tx/${funding.txid}`} target="_blank" rel="noreferrer">View <ExternalLink size={10} /></a>}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {funding.provider === "bank" && (
                      <>
                        <CopyRow label="Your reference" value={funding.reference} testid="fund-bank-reference" />
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <div className="lab !mb-2">SEND {fmtUsd(funding.amount, 0)} TO</div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-neutral-400">
                            <span>Bank</span><span className="text-right text-white">{funding.bank?.bank_name || "—"}</span>
                            <span>Account name</span><span className="text-right text-white">{funding.bank?.account_name || "—"}</span>
                            <span>Account no.</span><span className="text-right text-white">{funding.bank?.account_number || "—"}</span>
                            {funding.bank?.routing_number && <><span>Routing</span><span className="text-right text-white">{funding.bank.routing_number}</span></>}
                          </div>
                          {funding.bank?.instructions && <p className="text-xs text-neutral-500 mt-3 border-t border-white/5 pt-2">{funding.bank.instructions}</p>}
                        </div>
                        {isOpenFunding(funding) && funding.status === "awaiting_transfer" && (
                          <div className="space-y-2">
                            <label className="lab !mb-0 block" htmlFor="fund-bank-note">Transfer note (optional)</label>
                            <input id="fund-bank-note" className="sf-input w-full !text-xs" placeholder="Reference used by your bank"
                                   value={bankNote} onChange={(e) => setBankNote(e.target.value)} data-testid="fund-bank-note-input" />
                            <button className="sf-btn sf-btn-p w-full" onClick={bankSent} disabled={busy} data-testid="fund-bank-sent">
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} I've sent the transfer
                            </button>
                          </div>
                        )}
                        {funding.status === "pending_review" && (
                          <p className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3 text-xs text-sky-200/80" data-testid="fund-bank-review">
                            Transfer marked as sent. The admin will review it and credit your buying power.
                          </p>
                        )}
                      </>
                    )}

                    {isCredited(funding) && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] p-3 text-center" data-testid="fund-success">
                        <CircleCheck size={20} className="mx-auto text-emerald-400" />
                        <p className="font-mono text-xs font-bold text-emerald-300 mt-1">{fmtUsd(funding.amount, 0)} credited</p>
                        <button className="sf-btn sf-btn-p sf-btn-sm w-full mt-3" onClick={openInvesting} data-testid="fund-invest-button">
                          <TrendingUp size={13} /> {can("paper") ? "Invest these funds" : "See investing tiers"} <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {["rejected", "expired", "failed"].includes(funding.status) && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 text-sm text-red-300" data-testid="fund-closed">
                        This funding request is {funding.status}. {funding.admin_note || "Start a new request to try again."}
                      </div>
                    )}

                    <button className="sf-btn w-full" onClick={() => { setFunding(null); setTxid(""); setBankNote(""); setErr(""); }} data-testid="fund-start-over">
                      <RefreshCw size={14} /> Start a new request
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleMethods.map((m) => {
                        const meta = PROVIDER_META[m.id];
                        const active = activeProvider === m.id;
                        return (
                          <button
                            key={m.id} disabled={!m.enabled}
                            onClick={() => { setProvider(m.id); setErr(""); }}
                            className={`text-left rounded-xl border p-3 transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${
                              active ? "border-[var(--a)] bg-[var(--a-soft)] text-white" : "border-white/10 text-neutral-400 hover:text-white"
                            }`}
                            data-testid={`fund-provider-${m.id}`}
                          >
                            <span className="flex items-center gap-2">{meta.icon}<b className="text-sm">{meta.label}</b></span>
                            <span className="block font-mono text-[9px] text-neutral-500 mt-1">
                              {m.enabled ? `${meta.sub}${m.mode && m.mode !== "sandbox" ? ` · ${m.mode}` : ""}` : "SETUP NEEDED"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {FUND_QUICK.map((q) => (
                        <button
                          key={q} onClick={() => setAmount(String(q))} data-testid={`fund-quick-${q}`}
                          className={`font-mono text-xs min-h-[44px] py-2 border transition-colors duration-150 ${
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
                        className="sf-input w-full mt-1 !text-lg" type="number" min={fundMin} max={fundMax} step="any"
                        value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="fund-amount-input"
                      />
                    </label>
                    <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500 border-t border-white/5 pt-3">
                      <span>Payment method</span>
                      <span className="text-white">{activeProvider ? PROVIDER_META[activeProvider].label : "—"}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-neutral-500">
                      Practice credits only. No cash value, no securities are purchased, and this is not investment advice.
                    </p>
                  </>
                )}
              </div>
            )}

            {!(tab === "fund" && funding) && (
              <button
                className="sf-btn sf-btn-p w-full !py-3 mt-4"
                onClick={submit}
                disabled={busy || (tab === "fund" && !activeProvider)}
                data-testid="deposit-submit-btn"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : tab === "withdraw" ? <ArrowUpFromLine size={14} /> : tab === "fund" ? <CreditCard size={14} /> : <ArrowDownToLine size={14} />}
                {busy
                  ? "Processing…"
                  : tab === "withdraw"
                    ? `Transfer out ${fmtUsd(Number(amount) || 0, 0)}`
                    : tab === "fund"
                      ? `Continue with ${activeProvider ? PROVIDER_META[activeProvider].label : "payment"}`
                      : `Deposit ${fmtUsd(Number(amount) || 0, 0)}`}
              </button>
            )}

            {!receipt && !(tab === "fund" && funding) && (
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

            <p className="font-mono text-[10px] leading-relaxed text-neutral-400 mt-4 border-t border-white/5 pt-3">
              {me?.email ? `Account ${me.email} · ` : ""}Every credit is recorded once in your ledger. Simulated funds are for practice only. Not investment advice.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
