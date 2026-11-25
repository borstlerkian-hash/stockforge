import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Bot, Download, LineChart, Layers, ShieldCheck } from "lucide-react";
import { Background } from "@/components/sf/Background";
import { InstallDrawer } from "@/components/sf/InstallDrawer";
import { applyTheme, pct, priceFmt } from "@/lib/theme";
import { useSite } from "@/lib/site";
import { apiGet } from "@/lib/api";
import { AnnouncementBanner } from "@/components/sf/AnnouncementBanner";

const FEATURES = [
  { icon: Activity, t: "Full universe", d: "All ~4,000 NASDAQ listings and the top 100 cryptos, live, searchable and sortable." },
  { icon: LineChart, t: "Forecasts", d: "Monte Carlo cones with best, average and worst case, support & resistance rails and probabilities." },
  { icon: Bot, t: "AI advisor", d: "An intelligent market assistant that reads signals and explains what they mean in plain language." },
  { icon: Layers, t: "10 tiers", d: "Every tier reshapes the terminal and unlocks deeper interface modes — from professional to void singularity." },
];

// Public tape: the same live snapshot the terminal uses, so the landing page
// shows real prices instead of decorative placeholders.
const PublicTape = () => {
  const { data } = useQuery({
    queryKey: ["public-snapshot"],
    queryFn: () => apiGet("/snapshot"),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const items = data?.tickers || [];
  if (!items.length) return null;
  return (
    <div className="tape overflow-hidden border-y border-[var(--a-line)] bg-[#080B11]/70 py-2 -mx-6 lg:-mx-12 px-6 lg:px-12" data-testid="landing-tape">
      <div className="tape-track font-mono text-[11px] whitespace-nowrap">
        {[...items, ...items].map((i, k) => (
          <span key={`${i.sym}-${k}`} className="inline-flex gap-2 items-center">
            <b className="text-neutral-200">{i.sym}</b>
            <span className="text-neutral-400">{priceFmt(i.price)}</span>
            <span className={i.chg >= 0 ? "bull" : "bear"}>{pct(i.chg)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default function Landing() {
  const [install, setInstall] = useState(false);
  const s = useSite().data?.settings;
  useEffect(() => applyTheme(5, s, { mode: "smooth" }), [s]);
  const headline = s?.landing_headline;
  const year = new Date().getFullYear();
  return (
    <div className="min-h-screen relative overflow-hidden">
      <Background tier={5} mode="smooth" />
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="relative z-20"><AnnouncementBanner /></div>
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <nav className="flex items-center justify-between py-6" aria-label="Primary">
          <span className="font-disp font-bold tracking-[0.12em] sm:tracking-[0.2em] text-xl" data-testid="landing-site-name">{s?.site_name || "OBSIDIAN VANE"}</span>
          <div className="flex gap-2">
            <button className="sf-btn hidden sm:inline-flex" onClick={() => setInstall(true)} data-testid="landing-get-app-button"><Download size={14} /> Get app</button>
            <Link to="/sign-in" className="sf-btn sf-btn-p" data-testid="landing-sign-in-button">Sign in</Link>
          </div>
        </nav>
        <PublicTape />
        <main id="main">
          <section className="grid lg:grid-cols-12 gap-10 pt-10 sm:pt-16 lg:pt-24 pb-16">
            <motion.div className="lg:col-span-7" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="kicker mb-5 flex items-center gap-2"><span className="pulse-dot" /> {s?.tagline || "MARKET INTELLIGENCE"} · v3</p>
              <h1 className="font-disp text-[2.6rem] sm:text-6xl lg:text-7xl font-bold leading-[0.98] tracking-tight text-balance" data-testid="landing-headline">
                {headline && headline !== "The market, distilled into one clear signal." ? headline : <>The market,<br /><span className="accent">distilled</span> into one<br />clear signal.</>}
              </h1>
              <p className="text-neutral-400 text-base md:text-lg max-w-xl mt-6 leading-relaxed" data-testid="landing-sub">
                {s?.landing_sub || "Obsidian Vane puts every NASDAQ company and the top 100 cryptos in one terminal — Monte Carlo forecasts with support & resistance, an AI advisor, deposits to invest, and ten membership tiers that transform the whole interface."}
              </p>
              <div className="flex flex-wrap gap-3 mt-10">
                <Link to="/sign-in" className="sf-btn sf-btn-p !px-6 !py-4 !text-sm" data-testid="landing-cta-button">Enter the terminal</Link>
                <button className="sf-btn !px-6 !py-4 !text-sm" onClick={() => setInstall(true)} data-testid="landing-download-button"><Download size={16} /> Download the app</button>
              </div>
              <p className="font-mono text-[10px] tracking-widest text-neutral-500 mt-6 flex items-center gap-2"><ShieldCheck size={12} /> EMAIL OR GOOGLE SIGN-IN · ROOKIE TIER IS FREE · NOT INVESTMENT ADVICE</p>
            </motion.div>
            <div className="lg:col-span-5 grid sm:grid-cols-2 gap-4 content-end">
              {FEATURES.map((f, i) => (
                <motion.div key={f.t} className="sf-panel sf-hover p-5" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <f.icon className="accent mb-4" size={20} />
                  <p className="font-disp text-lg">{f.t}</p>
                  <p className="text-sm text-neutral-400 mt-1">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
        <footer className="border-t border-white/[0.06] py-8 flex flex-col sm:flex-row gap-3 sm:gap-6 justify-between font-mono text-[10px] tracking-widest text-neutral-500">
          <span>© {year} {s?.site_name || "OBSIDIAN VANE"}</span>
          <span>MARKET DATA MAY BE DELAYED · NOT INVESTMENT ADVICE</span>
          <div className="flex gap-5">
            <button className="hover:text-neutral-200 transition-colors" onClick={() => setInstall(true)}>INSTALL</button>
            <Link to="/sign-in" className="hover:text-neutral-200 transition-colors">SIGN IN</Link>
          </div>
        </footer>
      </div>
      <InstallDrawer open={install} onOpenChange={setInstall} />
    </div>
  );
}
