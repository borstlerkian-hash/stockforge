import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Toaster } from "sonner";
import { ArrowUp } from "lucide-react";
import { SFProvider, useSF } from "@/context/SFContext";
import { Background } from "@/components/sf/Background";
import { Header, MobileNav } from "@/components/sf/Header";
import { CommandPalette } from "@/components/sf/CommandPalette";
import { InstallDrawer } from "@/components/sf/InstallDrawer";
import { SettingsDrawer } from "@/components/sf/SettingsDrawer";
import { TickerDialog } from "@/components/sf/TickerDialog";
import { useNavPages } from "@/components/sf/Header";
import { AnnouncementBanner } from "@/components/sf/AnnouncementBanner";
import { sectionOn, useSite } from "@/lib/site";
const Feed = lazy(() => import("@/pages/Feed"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Quotes = lazy(() => import("@/pages/Quotes"));
const Live = lazy(() => import("@/pages/Live"));
const Scanner = lazy(() => import("@/pages/Scanner"));
const Watchlist = lazy(() => import("@/pages/Watchlist"));
const Advisor = lazy(() => import("@/pages/Advisor"));
const Paper = lazy(() => import("@/pages/Paper"));
const Tiers = lazy(() => import("@/pages/Tiers"));
const Admin = lazy(() => import("@/pages/Admin"));
import { BtcCheckout } from "@/components/sf/BtcCheckout";
import { NotificationsSheet } from "@/components/sf/NotificationsSheet";
const Markets = lazy(() => import("@/pages/Markets"));
const PredictionDialog = lazy(() => import("@/components/forge/PredictionDialog"));
const DepositDialog = lazy(() => import("@/components/forge/DepositDialog"));

// Warm every route chunk once the browser is idle so navigation never waits on the network.
const prefetchRoutes = () => {
  const run = () => [
    import("@/pages/Dashboard"), import("@/pages/Markets"), import("@/pages/Quotes"), import("@/pages/Live"), import("@/pages/Scanner"),
    import("@/pages/Watchlist"), import("@/pages/Advisor"), import("@/pages/Paper"), import("@/pages/Tiers"),
    import("@/components/forge/PredictionDialog"), import("@/components/forge/DepositDialog"),
  ];
  (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(run);
};

// Skeleton placeholder shaped like a page: hero line + a card grid.
const PageFallback = ({ testid = "page-loading" }) => (
  <div className="space-y-6" data-testid={testid} aria-busy="true">
    <div className="space-y-3"><div className="sk h-3 w-28" /><div className="sk h-10 w-72 max-w-full" /><div className="sk h-4 w-96 max-w-full" /></div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((k) => <div key={k} className="sk h-56" />)}</div>
  </div>
);

const goTrade = (sf, sym) => {
  sf.openPredict(null);
  if (sf.can("paper")) { sf.setTradeSym(sym); sf.setPage("trade"); } else { sf.setPage("tiers"); }
};

const MarketsView = () => {
  const sf = useSF();
  return <Markets watch={sf.me.watch} onPredict={sf.openPredict} onTrade={(s) => goTrade(sf, s)} onToggleWatch={sf.toggleWatch} />;
};

const ForgeOverlays = () => {
  const sf = useSF();
  return (
    <>
      <Suspense fallback={null}>
      <PredictionDialog sym={sf.predictSym} onClose={() => sf.openPredict(null)} onTrade={(s) => goTrade(sf, s)}
        onToggleWatch={sf.toggleWatch} watching={!!sf.me?.watch.includes(sf.predictSym)} canTrade={sf.can("paper")} />
      <DepositDialog open={sf.depositOpen} onClose={() => sf.setDepositOpen(false)} onFunds={sf.refreshMe} />
      </Suspense>
    </>
  );
};

const VIEWS = { home: Feed, markets: MarketsView, dash: Dashboard, quotes: Quotes, live: Live, scan: Scanner, watch: Watchlist, ai: Advisor, trade: Paper, tiers: Tiers, admin: Admin };

const Boot = () => {
  const [show, setShow] = useState(() => {
    try {
      // Motion-sensitive users skip the intro entirely.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      return !sessionStorage.getItem("sf_booted");
    } catch { return false; }
  });
  const [leaving, setLeaving] = useState(false);
  const [stage, setStage] = useState(0);
  const rain = useMemo(
    () => Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)))),
    [],
  );
  const finish = () => { try { sessionStorage.setItem("sf_booted", "1"); } catch { /* ignore */ } setShow(false); };
  useEffect(() => {
    if (!show) return;
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 120));
    timers.push(setTimeout(() => setStage(2), 420));
    timers.push(setTimeout(() => setStage(3), 900));
    timers.push(setTimeout(() => setLeaving(true), 1650));
    timers.push(setTimeout(finish, 1950));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
  if (!show) return null;
  const siteName = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem("sf_site_name") || "null");
      return stored && !/stockforge/i.test(stored) ? stored : null;
    } catch { return null; }
  })() || "OBSIDIAN VANE";
  const skip = () => { setLeaving(true); setTimeout(finish, 220); };
  return (
    <div className={`fixed inset-0 z-[100] bg-[#080505] grid place-items-center overflow-hidden cursor-pointer ${leaving ? "boot-out" : ""}`} data-testid="boot-screen" role="status" aria-label="Loading Obsidian Vane" onClick={skip}>
      {/* Red ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30" style={{ background: "radial-gradient(circle, #ef4444 0%, #991b1b 40%, transparent 70%)" }} />
        <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] rounded-full blur-[80px] opacity-20" style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/3 w-[250px] h-[250px] rounded-full blur-[80px] opacity-15" style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }} />
      </div>
      {/* Subtle red matrix rain */}
      <div className="absolute inset-0 opacity-8 pointer-events-none">
        {rain.map((col, i) => (
          <div key={i} className="absolute top-0 font-mono text-[9px] text-red-400/30 leading-none" style={{ left: (i * 12.5) + "%", animation: "matrix-rain " + (3 + (i % 3)) + "s linear infinite", animationDelay: (i * 0.5) + "s", willChange: "transform" }}>
            {col.map((ch, j) => (
              <div key={j} style={{ opacity: 0.3 }}>{ch}</div>
            ))}
          </div>
        ))}
      </div>
      {/* Scan line - red */}
      <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent pointer-events-none" style={{ animation: "scan-line 3s linear infinite" }} />
      {/* Main content */}
      <div className="relative z-10 w-full max-w-lg text-center space-y-6 px-6">
        <div className="relative mx-auto w-28 h-28">
          <div className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse" style={{ background: "var(--a)" }} />
          <svg viewBox="0 0 64 64" className="relative w-full h-full" style={{ animation: "spin 4s linear infinite" }}>
            <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="var(--a)" strokeWidth="2" opacity="0.9" />
            <circle cx="32" cy="32" r="6" fill="var(--a)" opacity="0.9">
              <animate attributeName="r" values="4;10;4" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="32" r="3" fill="#ffffff" opacity="0.95">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
        <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="font-disp text-5xl font-bold tracking-[0.2em] text-white" style={{ textShadow: "0 0 40px rgba(239,68,68,0.4), 0 0 80px rgba(239,68,68,0.2)" }}>{siteName}</p>
          <p className="font-mono text-[10px] tracking-[0.35em] accent mt-2">MARKET INTELLIGENCE · v3</p>
        </div>
        <div className={`transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
          <p className="font-mono text-xs text-neutral-400 mt-2 caret">{stage >= 3 ? "systems online" : "linking market feeds"}</p>
          <div className="boot-bar h-[2px] bg-white/5 mt-3 overflow-hidden rounded-full"><i className="block h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500" style={{ animation: "boot 1.2s ease forwards" }} /></div>
        </div>
        <div className={`flex justify-center gap-2 mt-2 transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
          {["INIT", "AUTH", "FEEDS", "READY"].map((s, i) => (
            <span key={s} className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border transition-all duration-300 ${stage > i ? "border-red-500/40 text-red-400 bg-red-500/10 shadow-[0_0_8px_rgba(239,68,68,0.2)]" : "border-white/10 text-neutral-600"}`}>{s}</span>
          ))}
        </div>
        {/* Welcome message */}
        <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="font-disp text-2xl font-bold tracking-[0.15em] text-white mt-4" style={{ textShadow: "0 0 20px rgba(239,68,68,0.4)" }}>WELCOME</p>
          <p className="font-mono text-[10px] tracking-widest text-neutral-500 mt-1">MARKET INTELLIGENCE, DELIVERED</p>
        </div>
        <p className="font-mono text-[9px] tracking-[0.3em] text-neutral-600 pt-2">TAP TO SKIP</p>
      </div>
    </div>
  );
};

const PreviewBar = () => {
  const { preview, setPreview, me, snap, upgrade } = useSF();
  if (!preview || !me || preview <= me.tier) return null;
  const t = snap.tiers[preview - 1];
  return (
    <div className="sticky top-[97px] z-30 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-[var(--a)] text-black font-mono text-xs" data-testid="preview-bar">
      Previewing the T{t.id} {t.name} look · features stay at your current tier
      <button className="px-2 py-1 bg-black text-white" onClick={() => upgrade(preview)} data-testid="preview-upgrade-button">Upgrade {t.price}</button>
      <button className="px-2 py-1 border border-black" onClick={() => setPreview(null)} data-testid="preview-exit-button">Exit preview</button>
    </div>
  );
};

const Shell = () => {
  const { page, setPage, themeTier, interfaceMode, snap, me, setTheme } = useSF();
  const [cmd, setCmd] = useState(false);
  const [install, setInstall] = useState(false);
  const [settings, setSettings] = useState(false);
  const [bell, setBell] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const pages = useNavPages();
  const site = useSite().data?.settings;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((c) => !c); return; }
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || e.metaKey || e.ctrlKey) return;
      if (/^[1-9]$/.test(e.key) && pages[Number(e.key) - 1]) setPage(pages[Number(e.key) - 1].id);
      if (me && e.key === "]" && themeTier < me.tier) setTheme(themeTier + 1);
      if (me && e.key === "[" && themeTier > 1) setTheme(Math.min(themeTier, me.tier) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPage, me, themeTier, setTheme, pages]);

  useEffect(() => { prefetchRoutes(); }, []);
  useEffect(() => { if (site?.site_name) try { localStorage.setItem("sf_site_name", JSON.stringify(site.site_name)); } catch { /* ignore */ } }, [site?.site_name]);
  const View = (sectionOn(site, page) && VIEWS[page]) || Feed;
  return (
    <div className="min-h-screen relative">
      <Boot />
      <Background tier={themeTier} mode={interfaceMode} />
      <div className="relative z-10">
        <Header onCmd={() => setCmd(true)} onInstall={() => setInstall(true)} onBell={() => setBell(true)} onSettings={() => setSettings(true)} />
        <AnnouncementBanner />
        <PreviewBar />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 lg:pb-16">
          <p className="font-mono text-[10px] tracking-widest text-neutral-500 mb-6 hidden sm:block" data-testid="snapshot-note">
            SESSION SNAPSHOT · {snap?.snapshotDate} · <span className="accent">MARKETS</span> covers every NASDAQ listing + top 100 crypto live · not investment advice
          </p>
          {snap && me ? <Suspense fallback={<PageFallback />}><div key={page} className="page-in"><View /></div></Suspense> : <PageFallback testid="terminal-loading" />}
        </main>
        <footer className="hidden lg:flex max-w-[1600px] mx-auto px-8 py-6 justify-between font-mono text-[10px] tracking-widest text-neutral-600 border-t border-white/5">
          <span>OBSIDIAN VANE · {snap?.snapshotDate}</span>
          <span>⌘K palette · 1–9 pages · [ ] tier look · esc close</span>
          <span>NOT INVESTMENT ADVICE</span>
        </footer>
        <MobileNav onInstall={() => setInstall(true)} onCmd={() => setCmd(true)} onSettings={() => setSettings(true)} />
        {showTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            data-testid="scroll-to-top"
            className="lg:hidden fixed right-4 bottom-24 z-40 w-10 h-10 grid place-items-center rounded-full bg-[#0D131F]/90 border border-white/10 text-neutral-300 shadow-lg backdrop-blur-sm active:scale-95 transition"
            aria-label="Scroll to top"
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
      <CommandPalette open={cmd} onOpenChange={setCmd} onInstall={() => setInstall(true)} />
      <InstallDrawer open={install} onOpenChange={setInstall} />
      <SettingsDrawer open={settings} onOpenChange={setSettings} onInstall={() => setInstall(true)} />
      <TickerDialog />
      <BtcCheckout />
      <NotificationsSheet open={bell} onOpenChange={setBell} />
      <ForgeOverlays />
    </div>
  );
};

export default function Terminal() {
  return (
    <SFProvider>
      <Shell />
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#0D131F", border: "1px solid var(--a-line)", borderRadius: 8, color: "#F1F5F9", fontFamily: "JetBrains Mono Variable, monospace", fontSize: 12 } }} />
    </SFProvider>
  );
}
