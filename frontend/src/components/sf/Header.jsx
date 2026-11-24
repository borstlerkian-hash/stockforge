import { useEffect, useState } from "react";
import { Home, BarChart3, LayoutDashboard, Bot, Star, MoreHorizontal, Download, Search, Wifi, WifiOff, ArrowDownUp, Activity, Eye, Crown, Shield, TrendingUp, Zap, Settings } from "lucide-react";
import { UserButton } from "@clerk/react";
import { useSF } from "@/context/SFContext";
import { PAGES, pct, priceFmt } from "@/lib/theme";
import { BellButton } from "@/components/sf/NotificationsSheet";
import { sectionOn, useSite } from "@/lib/site";

const Clock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="hidden xl:flex items-center gap-2 font-mono text-xs text-neutral-400" data-testid="header-clock">
      <span className="pulse-dot" />{t.toLocaleTimeString("en-US", { hour12: false })}
    </span>
  );
};

const NetPill = () => {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const f = () => setOn(navigator.onLine);
    window.addEventListener("online", f); window.addEventListener("offline", f);
    return () => { window.removeEventListener("online", f); window.removeEventListener("offline", f); };
  }, []);
  return (
    <span className={`hidden md:flex items-center gap-1.5 font-mono text-[10px] tracking-widest px-2 py-1 border ${on ? "border-green-500/30 text-green-400" : "border-red-500/40 text-red-400"}`} data-testid="network-status">
      {on ? <Wifi size={12} /> : <WifiOff size={12} />}{on ? "ONLINE" : "OFFLINE"}
    </span>
  );
};

const TierSwitch = () => {
  const { snap, me, themeTier, setTheme } = useSF();
  if (!snap || !me) return null;
  return (
    <select
      className="sf-input !py-1.5 !text-xs hidden sm:block"
      value={Math.min(themeTier, me.tier)}
      onChange={(e) => setTheme(Number(e.target.value))}
      aria-label="Terminal look"
      data-testid="tier-theme-select"
    >
      {snap.tiers.filter((t) => t.id <= me.tier).map((t) => <option key={t.id} value={t.id}>T{t.id} {t.name}</option>)}
    </select>
  );
};

export const TickerTape = () => {
  const { snap, markets } = useSF();
  const items = [
    ...(markets?.crypto || []).map((c) => ({ s: c.sym, p: c.price, c: c.chg })),
    ...(snap?.tickers || []).map((t) => ({ s: t.sym, p: t.price, c: t.chg })),
  ];
  return (
    <div className="tape overflow-hidden border-t border-[var(--a-line)] bg-[#080B11]/70 py-1.5" data-testid="ticker-tape">
      <div className="tape-track font-mono text-xs whitespace-nowrap">
        {[...items, ...items].map((i, k) => (
          <span key={k} className="inline-flex gap-2"><b className="text-neutral-200">{i.s}</b><span className="text-neutral-400">{priceFmt(i.p)}</span><span className={i.c >= 0 ? "bull" : "bear"}>{pct(i.c)}</span></span>
        ))}
      </div>
    </div>
  );
};

export const navPages = (me, settings) => (me?.is_admin ? [...PAGES, { id: "admin", label: "Admin" }] : PAGES).filter((p) => sectionOn(settings, p.id));
export const useNavPages = () => { const { me } = useSF(); const settings = useSite().data?.settings; return navPages(me, settings); };

export const Header = ({ onCmd, onInstall, onBell }) => {
  const { page, setPage, snap, me, themeTier, setDepositOpen } = useSF();
  const tier = snap?.tiers[(me?.tier || 1) - 1];
  const pages = useNavPages();
  const site = useSite().data?.settings;
  return (
    <header className="sticky top-0 z-40 bg-[#080B11]/95 border-b border-white/[0.06] sm:backdrop-blur-xl sm:bg-[#080B11]/85" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="max-w-[1600px] mx-auto flex items-center gap-2 sm:gap-4 px-3 sm:px-4 lg:px-8 h-14 sm:h-16">
        <button className="flex items-center gap-3 shrink-0" onClick={() => setPage("home")} data-testid="brand-home-button">
          <span className="relative w-8 h-8 grid place-items-center">
            <span className="absolute inset-0 rounded-full blur-md animate-pulse" style={{ background: "var(--a)", opacity: 0.6 }} />
            <span className="relative w-5 h-5 rotate-45 border-2 animate-spin" style={{ borderColor: "var(--a)", animationDuration: "8s" }} />
          </span>
          <span className="text-left leading-none">
            <span className="font-disp font-bold tracking-[0.18em] text-base sm:text-lg block" data-testid="header-site-name">{site?.site_name || "STOCKFORGE"}</span>
            <span className="font-mono text-[9px] tracking-[0.3em] accent" data-testid="header-tier-sub">{snap?.tiers[themeTier - 1]?.name} TERMINAL</span>
          </span>
        </button>
        <nav className="hidden lg:flex items-center gap-0.5 mx-auto" aria-label="Primary">
          {pages.map((p) => (
            <button key={p.id} onClick={() => setPage(p.id)} data-testid={`nav-${p.id}`}
              className={`nav-pill ${page === p.id ? "nav-pill-on" : ""}`}>
              {p.id === "live" ? "● " : ""}{p.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <button className="sf-btn sf-btn-sm" onClick={onCmd} data-testid="command-palette-button" aria-label="Open command palette"><Search size={14} /><span className="hidden md:inline">Search</span><kbd className="hidden md:inline text-[10px] text-neutral-500">⌘K</kbd></button>
          <button className="sf-btn sf-btn-sm" onClick={() => setDepositOpen(true)} data-testid="header-deposit-button"><span className="accent">$</span><span className="hidden sm:inline">Deposit</span></button>
          <BellButton onClick={onBell} />
          <NetPill />
          <button className="sf-btn sf-btn-sm sf-btn-p hidden sm:inline-flex" onClick={onInstall} data-testid="get-app-button"><Download size={14} /><span className="hidden sm:inline">Get app</span></button>
  {me && me.tier >= 5 && <button className="sf-btn sf-btn-sm" onClick={onInstall} data-testid="settings-button" aria-label="Design settings"><Settings size={14} /><span className="hidden sm:inline">Settings</span></button>}
          <Clock />
          <TierSwitch />
          {tier && <span className="hidden md:inline font-mono text-[10px] px-2 py-1 border border-[var(--a)] accent tracking-widest" data-testid="tier-badge">T{tier.id} {tier.name}</span>}
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-[var(--a)]/30" } }} />
        </div>
      </div>
      <TickerTape />
    </header>
  );
};

export const MobileNav = () => {
  const { page, setPage } = useSF();
  const pages = useNavPages();
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!more) return;
    const onKey = (e) => { if (e.key === "Escape") setMore(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [more]);
  // Primary tabs shown directly in the dock; the rest live behind "More".
const ICONS = { home: Home, markets: BarChart3, dash: LayoutDashboard, ai: Bot, watch: Star };
const MORE_ICONS = { markets: BarChart3, dash: LayoutDashboard, quotes: TrendingUp, live: Activity, scan: Zap, watch: Eye, ai: Bot, trade: ArrowDownUp, tiers: Crown, admin: Shield };
const PRIMARY = ["home", "markets", "dash", "ai", "watch"];
  const primary = pages.filter((p) => PRIMARY.includes(p.id));
  const rest = pages.filter((p) => !PRIMARY.includes(p.id));
  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 mobile-dock" aria-label="Primary mobile">
        <div className="flex items-center justify-around gap-0 px-1 py-1.5">
          {primary.map((p) => {
            const Icon = ICONS[p.id];
            return (
              <button key={p.id} onClick={() => setPage(p.id)} data-testid={`mobile-nav-${p.id}`}
                className={`dock-btn flex-1 min-w-0 flex flex-col items-center gap-0.5 ${page === p.id ? "dock-btn-on" : ""}`}>
                {Icon && <Icon size={16} />}
                <span className="text-[8px] leading-none">{p.label}</span>
              </button>
            );
          })}
          {rest.length > 0 && (
            <button onClick={() => setMore(true)} data-testid="mobile-nav-more"
              className={`dock-btn flex-1 min-w-0 flex flex-col items-center gap-0.5 ${rest.some((p) => p.id === page) ? "dock-btn-on" : ""}`}>
              <MoreHorizontal size={16} />
              <span className="text-[8px] leading-none">More</span>
            </button>
          )}
        </div>
      </nav>
      {more && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setMore(false)} data-testid="mobile-more-overlay">
          <div className="w-full bg-[#0D131F] border-t border-white/10 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()} data-testid="mobile-more-sheet">
            <div className="flex items-center justify-between mb-3">
              <span className="font-disp text-lg">More pages</span>
              <button className="sf-btn sf-btn-sm" onClick={() => setMore(false)} data-testid="mobile-more-close">Close</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {rest.map((p) => {
                const Icon = MORE_ICONS[p.id];
                return (
                  <button key={p.id} onClick={() => { setPage(p.id); setMore(false); }} data-testid={`mobile-more-${p.id}`}
                    className={`dock-btn !py-3 !min-h-[52px] flex flex-col items-center gap-1 ${page === p.id ? "dock-btn-on" : ""}`}>
                    {Icon && <Icon size={18} />}
                    <span className="text-[8px] leading-none">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
