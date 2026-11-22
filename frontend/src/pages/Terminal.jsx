import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ArrowUp } from "lucide-react";
import { SFProvider, useSF } from "@/context/SFContext";
import { Background } from "@/components/sf/Background";
import { Header, MobileNav } from "@/components/sf/Header";
import { CommandPalette } from "@/components/sf/CommandPalette";
import { InstallDrawer } from "@/components/sf/InstallDrawer";
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
import { AdminAccess } from "@/components/sf/AdminAccess";
import { HackerAvatar } from "@/components/sf/HackerAvatar";
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
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem("sf_booted"); } catch { return false; } });
  const [leaving, setLeaving] = useState(false);
  const [stage, setStage] = useState(0);
  const [showCredit, setShowCredit] = useState(false);
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    if (!show) return;
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 300));
    timers.push(setTimeout(() => setStage(2), 1200));
    timers.push(setTimeout(() => setStage(3), 2200));
    timers.push(setTimeout(() => setShowCredit(true), 1800));
    // Glitch effect on title
    timers.push(setTimeout(() => setGlitch(true), 1000));
    timers.push(setTimeout(() => setGlitch(false), 1150));
    timers.push(setTimeout(() => setGlitch(true), 2800));
    timers.push(setTimeout(() => setGlitch(false), 2950));
    timers.push(setTimeout(() => setLeaving(true), 6500));
    timers.push(setTimeout(() => { try { sessionStorage.setItem("sf_booted", "1"); } catch { /* ignore */ } setShow(false); }, 7200));
    return () => timers.forEach(clearTimeout);
  }, [show]);
  if (!show) return null;
  const siteName = (() => { try { return JSON.parse(localStorage.getItem("sf_site_name") || "null"); } catch { return null; } })() || "STOCKFORGE";
  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-[#050510] grid place-items-center overflow-hidden ${leaving ? "boot-out" : ""}`} data-testid="boot-screen">
        {/* Matrix rain background - denser */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="absolute top-0 font-mono text-[10px] text-green-400/50 leading-none" style={{ left: (i * 4.2) + "%", animation: "matrix-rain " + (2 + (i % 4) * 0.5) + "s linear infinite", animationDelay: ((i * 0.3) % 2) + "s" }}>
              {Array.from({ length: 20 }).map((_, j) => (
                <div key={j} style={{ opacity: Math.random() * 0.6 + 0.2 }}>{String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}</div>
              ))}
            </div>
          ))}
        </div>
        {/* Scan line */}
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" style={{ animation: "scan-line 2.5s linear infinite" }} />
        {/* Horizontal glitch lines */}
        {glitch && (
          <div className="absolute inset-0 pointer-events-none z-[102]">
            <div className="absolute inset-x-0 h-1 bg-cyan-400/20" style={{ top: "30%", animation: "glitch-shift 0.15s steps(2) infinite" }} />
            <div className="absolute inset-x-0 h-1 bg-red-400/10" style={{ top: "60%", animation: "glitch-shift 0.1s steps(2) infinite reverse" }} />
          </div>
        )}
        <div className="relative z-10 w-80 text-center space-y-5">
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-pulse" style={{ background: "var(--a)" }} />
            <svg viewBox="0 0 64 64" className="relative w-full h-full" style={{ animation: "spin 3s linear infinite" }}>
              <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="var(--a)" strokeWidth="2" opacity="0.9" />
              <polygon points="32,12 50,22 50,42 32,52 14,42 14,22" fill="none" stroke="var(--a)" strokeWidth="1" opacity="0.4" />
              <circle cx="32" cy="32" r="6" fill="var(--a)" opacity="0.9">
                <animate attributeName="r" values="4;12;4" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="32" cy="32" r="3" fill="#ffffff" opacity="0.95">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className={`font-disp text-4xl font-bold tracking-[0.2em] text-white transition-all duration-100 ${glitch ? "translate-x-1 text-cyan-300" : ""}`}>{siteName}</p>
            <p className="font-mono text-[10px] tracking-[0.35em] accent mt-1">NEURAL TERMINAL · v3</p>
          </div>
          <div className={`transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
            <p className="font-mono text-xs text-neutral-400 mt-2 caret">{stage >= 3 ? "systems online" : "linking market feeds"}</p>
            <div className="boot-bar h-[2px] bg-white/5 mt-3 overflow-hidden rounded-full"><i className="block h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" style={{ animation: "boot 1.5s ease forwards" }} /></div>
          </div>
          <div className={`flex justify-center gap-2 mt-2 transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
            {["INIT", "AUTH", "FEEDS", "READY"].map((s, i) => (
              <span key={s} className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border transition-all duration-300 ${stage > i ? "border-cyan-400/40 text-cyan-400 bg-cyan-400/10 shadow-[0_0_8px_rgba(0,255,255,0.2)]" : "border-white/10 text-neutral-600"}`}>{s}</span>
            ))}
          </div>
          {/* Made by Kiki - visible during loading */}
          <div className={`flex items-center justify-center gap-2 mt-4 transition-all duration-700 ${stage >= 1 ? "opacity-100" : "opacity-0"}`}>
            <HackerAvatar size={32} />
            <span className="font-mono text-[9px] tracking-widest text-neutral-500">CREATED BY KIKI</span>
          </div>
        </div>
      </div>
      {/* Made by Kiki popup - appears during loading */}
      {showCredit && (
        <div className={`fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
          <div className={`relative bg-[#0a0a14]/95 border border-cyan-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4 shadow-[0_0_80px_rgba(0,255,255,0.2)] transition-all duration-500 ${leaving ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/5" />
              <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)" }} />
            </div>
            <HackerAvatar size={112} className="mx-auto" />
            <div>
              <p className="font-disp text-3xl font-bold tracking-[0.15em] text-white" style={{ textShadow: "0 0 20px rgba(0,255,255,0.5)" }}>CREATED BY KIKI</p>
              <p className="font-mono text-[10px] tracking-widest text-cyan-400 mt-2">DESIGNER · DEVELOPER · CREATOR</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] text-neutral-500 tracking-widest">
              <span className="pulse-dot" />
              <span>INITIALIZING NEURAL TERMINAL</span>
            </div>
            <div className="boot-bar h-[2px] bg-white/5 overflow-hidden rounded-full"><i className="block h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" style={{ animation: "boot 2.5s ease forwards" }} /></div>
          </div>
        </div>
      )}
    </>
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
  const { page, setPage, themeTier, snap, me, setTheme } = useSF();
  const [cmd, setCmd] = useState(false);
  const [install, setInstall] = useState(false);
  const [bell, setBell] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [pulling, setPulling] = useState(false);
  const pages = useNavPages();
  const site = useSite().data?.settings;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pull-to-refresh on mobile (only triggers on a deliberate downward pull)
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    let triggered = false;
    const onTouchStart = (e) => {
      if (window.scrollY <= 5) { startY = e.touches[0].clientY; pulling = true; triggered = false; }
    };
    const onTouchMove = (e) => {
      if (!pulling) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 80) { setPulling(true); triggered = true; }
      else if (dy < 10) { setPulling(false); triggered = false; }
    };
    const onTouchEnd = () => {
      if (pulling && triggered && window.scrollY <= 5) {
        window.location.reload();
      }
      pulling = false;
      triggered = false;
      setPulling(false);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
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
      <Background tier={themeTier} />
      <div className="relative z-10">
        <Header onCmd={() => setCmd(true)} onInstall={() => setInstall(true)} onBell={() => setBell(true)} />
        <AnnouncementBanner />
        <PreviewBar />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 lg:pb-16">
          <p className="font-mono text-[10px] tracking-widest text-neutral-500 mb-6 hidden sm:block" data-testid="snapshot-note">
            SESSION SNAPSHOT · {snap?.snapshotDate} · <span className="accent">MARKETS</span> covers every NASDAQ listing + top 100 crypto live · not investment advice
          </p>
          {snap && me ? <Suspense fallback={<PageFallback />}><div key={page} className="page-in"><View /></div></Suspense> : <PageFallback testid="terminal-loading" />}
        </main>
        <footer className="hidden lg:flex max-w-[1600px] mx-auto px-8 py-6 justify-between font-mono text-[10px] tracking-widest text-neutral-600 border-t border-white/5">
          <span>STOCKFORGE · {snap?.snapshotDate}</span>
          <span>⌘K palette · 1–9 pages · [ ] tier look · esc close</span>
          <span>NOT INVESTMENT ADVICE</span>
        </footer>
        <MobileNav />
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
        {pulling && (
          <div className="lg:hidden fixed top-0 inset-x-0 z-50 flex justify-center pt-2 pointer-events-none">
            <div className="bg-[#0D131F]/90 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 font-mono text-xs text-neutral-300 animate-pulse">
              Release to refresh
            </div>
          </div>
        )}
      </div>
      <CommandPalette open={cmd} onOpenChange={setCmd} onInstall={() => setInstall(true)} />
      <InstallDrawer open={install} onOpenChange={setInstall} extra={<AdminAccess onDone={() => setInstall(false)} />} />
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
