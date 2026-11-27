import { DEFAULT_MODE, INTERFACE_MODES, MODE_MATERIAL } from "./interfaceModes";

export const DEFAULT_MOTION = 0.75;

export const TIER_THEMES = [
  { a: "#d4d4d4", a2: "#737373", glow: 0.12, particles: 14, speed: 0.15, blur: 0 },
  { a: "#3b82f6", a2: "#22d3ee", glow: 0.2, particles: 26, speed: 0.2, blur: 4 },
  { a: "#10b981", a2: "#84cc16", glow: 0.3, particles: 34, speed: 0.28, blur: 6 },
  { a: "#6366f1", a2: "#a855f7", glow: 0.4, particles: 42, speed: 0.32, blur: 8 },
  { a: "#ef4444", a2: "#f97316", glow: 0.5, particles: 52, speed: 0.4, blur: 10 },
  { a: "#f97316", a2: "#facc15", glow: 0.6, particles: 60, speed: 0.48, blur: 12 },
  { a: "#06b6d4", a2: "#a78bfa", glow: 0.7, particles: 70, speed: 0.5, blur: 14 },
  { a: "#d946ef", a2: "#22d3ee", glow: 0.8, particles: 80, speed: 0.55, blur: 20 },
  { a: "#eab308", a2: "#f59e0b", glow: 0.9, particles: 90, speed: 0.45, blur: 16 },
  { a: "#ffffff", a2: "#8b5cf6", glow: 1.0, particles: 120, speed: 0.7, blur: 22 },
];

// Accent colours are opt-in. An empty accent means "use the tier / site colour".
export const ACCENTS = {
  red: "#ef4444",
  cyan: "#00F0FF",
  emerald: "#10B981",
  amber: "#F59E0B",
  violet: "#8B5CF6",
};

export const ACCENT_OPTIONS = [
  { id: "red", label: "Red" },
  { id: "cyan", label: "Cyan" },
  { id: "emerald", label: "Emerald" },
  { id: "amber", label: "Amber" },
  { id: "violet", label: "Violet" },
];

export const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export const themeVars = (tier) => {
  const t = TIER_THEMES[tier - 1] || TIER_THEMES[0];
  return {
    "--a": t.a,
    "--a2": t.a2,
    "--a-soft": rgba(t.a, 0.1),
    "--a-line": rgba(t.a, 0.18 + t.glow * 0.12),
    "--a-glow": rgba(t.a, 0.15 + t.glow * 0.35),
    "--blur": `${t.blur}px`,
  };
};

// brand = site settings; a set brand_primary / brand_secondary overrides the tier accent for everyone.
// design = per-user appearance: { mode, accent }. A saved accent wins over the site brand, but only
// when the member explicitly picked one, so empty accent keeps the shared brand / tier colour.
export const applyTheme = (tier, brand, design = {}) => {
  const root = document.documentElement;
  const vars = themeVars(tier);
  const hex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
  if (brand && hex(brand.brand_primary)) {
    const glow = (TIER_THEMES[tier - 1] || TIER_THEMES[0]).glow;
    Object.assign(vars, { "--a": brand.brand_primary, "--a-soft": rgba(brand.brand_primary, 0.1),
      "--a-line": rgba(brand.brand_primary, 0.18 + glow * 0.12), "--a-glow": rgba(brand.brand_primary, 0.15 + glow * 0.35) });
  }
  if (brand && hex(brand.brand_secondary)) vars["--a2"] = brand.brand_secondary;
  const accent = ACCENTS[design?.accent] || (hex(design?.accent) ? design.accent : "");
  if (accent) {
    const glow = (TIER_THEMES[tier - 1] || TIER_THEMES[0]).glow;
    Object.assign(vars, { "--a": accent, "--a-soft": rgba(accent, 0.1),
      "--a-line": rgba(accent, 0.18 + glow * 0.12), "--a-glow": rgba(accent, 0.15 + glow * 0.35) });
  }
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  const mode = INTERFACE_MODES.some((m) => m.id === design?.mode) ? design.mode : DEFAULT_MODE;
  const rawMotion = design?.motion;
  const motion = typeof rawMotion === "number" && Number.isFinite(rawMotion)
    ? Math.min(1, Math.max(0, rawMotion)) : DEFAULT_MOTION;
  root.dataset.tier = String(tier);
  root.dataset.mode = mode;
  root.dataset.material = MODE_MATERIAL[mode] || "glass";
  root.style.setProperty("--motion", String(motion));
  root.classList.toggle("fx-scan", mode !== "professional" && tier >= 3);
  root.classList.toggle("fx-hud", mode !== "professional" && tier >= 5);
  root.classList.toggle("fx-irid", mode !== "professional" && tier >= 7 && tier !== 9);
  root.classList.toggle("fx-gold", mode !== "professional" && tier === 9);
};

export const PAGES = [
  { id: "home", label: "Feed" },
  { id: "markets", label: "Markets" },
  { id: "dash", label: "Dashboard" },
  { id: "quotes", label: "Quotes" },
  { id: "live", label: "Live" },
  { id: "scan", label: "Scanner" },
  { id: "watch", label: "Watchlist" },
  { id: "ai", label: "Advisor" },
  { id: "trade", label: "Paper" },
  { id: "tiers", label: "Tiers" },
  { id: "about", label: "About" },
];

export const fmt = (n, d = 2) =>
  n == null || Number.isNaN(n) ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const money = (n, d = 2) => (n == null ? "—" : `${n < 0 ? "-" : ""}$${fmt(Math.abs(n), d)}`);
export const pct = (n) => (n == null ? "—" : `${n >= 0 ? "+" : ""}${Number(n).toFixed(2)}%`);
export const priceFmt = (p) => (p == null ? "—" : p < 1 ? `$${p.toFixed(4)}` : money(p, 2));
