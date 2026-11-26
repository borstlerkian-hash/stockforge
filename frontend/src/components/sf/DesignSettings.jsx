import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Briefcase, Check, Droplets, Lock, Orbit, Palette, Sparkles, Waves } from "lucide-react";
import { useSF } from "@/context/SFContext";
import { useSite } from "@/lib/site";
import { ACCENTS, ACCENT_OPTIONS, DEFAULT_MOTION, TIER_THEMES, rgba } from "@/lib/theme";
import { DEFAULT_MODE, INTERFACE_MODES, MODE_MATERIAL } from "@/lib/interfaceModes";
import { toast } from "sonner";

const MODE_ICONS = {
  professional: Briefcase,
  smooth: Waves,
  water: Droplets,
  scifi: Orbit,
  singularity: Sparkles,
};

const MODE_SIGNAL = {
  professional: "CALIPER",
  smooth: "GLIDE",
  water: "RIPPLE",
  scifi: "SCAN",
  singularity: "GRAVITY",
};

const ACCENT_PAIRS = {
  red: ["#ef4444", "#f97316"],
  cyan: ["#00F0FF", "#3b82f6"],
  emerald: ["#10B981", "#84cc16"],
  amber: ["#F59E0B", "#ef4444"],
  violet: ["#8B5CF6", "#22d3ee"],
};

const ROWS = [
  { sym: "NVDA", move: 2.84, w: 72 },
  { sym: "BTC", move: 1.36, w: 54 },
  { sym: "AAPL", move: -0.42, w: 31 },
];

export const DesignSettings = () => {
  const { me, api, setMe, snap, upgrade, interfaceMode } = useSF();
  const site = useSite().data?.settings;
  const [accent, setAccent] = useState(me?.design?.accent || "");
  const [motion, setMotion] = useState(
    typeof me?.design?.motion === "number" ? me.design.motion : DEFAULT_MOTION
  );
  const [cursorLag, setCursorLag] = useState(
    typeof me?.design?.cursorLag === "number" ? me.design.cursorLag : 0
  );
  const [hoverMode, setHoverMode] = useState(null);
  const [hoverAccent, setHoverAccent] = useState(null);
  const [saving, setSaving] = useState(false);
  const motionTimer = useRef(null);

  // `me` arrives after the first render, so sync once saved preferences are known.
  useEffect(() => {
    setAccent(me?.design?.accent || "");
    setMotion(typeof me?.design?.motion === "number" ? me.design.motion : DEFAULT_MOTION);
  }, [me?.design?.accent, me?.design?.motion]);

  useEffect(() => () => { if (motionTimer.current) clearTimeout(motionTimer.current); }, []);

  if (!me) return null;

  const tier = me.tier || 1;
  const mode = interfaceMode || me.design?.mode || DEFAULT_MODE;
  const previewMode = hoverMode || mode;
  const previewModeInfo = INTERFACE_MODES.find((m) => m.id === previewMode) || INTERFACE_MODES[1];
  const material = MODE_MATERIAL[previewMode] || "glass";
  const selectedAccent = hoverAccent !== null ? hoverAccent : accent;
  const autoPair = site?.brand_primary && site?.brand_secondary
    ? [site.brand_primary, site.brand_secondary]
    : [TIER_THEMES[tier - 1]?.a || "#ef4444", TIER_THEMES[tier - 1]?.a2 || "#f97316"];
  const pair = ACCENT_PAIRS[selectedAccent] || autoPair;
  const previewStyle = {
    "--a": pair[0],
    "--a2": pair[1],
    "--a-soft": rgba(pair[0], 0.12),
    "--a-line": rgba(pair[0], 0.3),
    "--a-glow": rgba(pair[0], 0.28),
  };

  const save = async (patch, message, quiet = false) => {
    setSaving(true);
    try {
      const design = await api.put("/me/design", { ...patch, cursorLag });
      setMe((m) => m && { ...m, design: { ...(m.design || {}), ...(design || patch) } });
      if (!quiet && message) toast.success(message);
      return true;
    } catch (e) {
      if (!quiet) toast.error(e instanceof Error ? e.message : "Could not save appearance");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const chooseMode = async (m) => {
    const minTier = snap?.modeGates?.[m.id] ?? m.minTier;
    if (minTier > tier) {
      toast(`${m.name} unlocks at T${minTier}`);
      upgrade(minTier);
      return;
    }
    if (m.id === mode) return;
    setHoverMode(null);
    await save({ mode: m.id }, `${m.name} mode on`);
  };

  const chooseAccent = async (id) => {
    if (id === accent) return;
    const previous = accent;
    setAccent(id);
    setHoverAccent(null);
    const ok = await save({ accent: id }, id ? `${ACCENT_OPTIONS.find((a) => a.id === id)?.label || "Accent"} accent on` : "Using the tier colour");
    if (!ok) setAccent(previous);
  };

  const queueMotion = (value) => {
    setMotion(value);
    if (motionTimer.current) clearTimeout(motionTimer.current);
    motionTimer.current = setTimeout(() => {
      motionTimer.current = null;
      save({ motion: value }, "", true);
    }, 180);
  };

  const flushMotion = (value = motion) => {
    if (!motionTimer.current) return;
    clearTimeout(motionTimer.current);
    motionTimer.current = null;
    save({ motion: value }, "", true);
  };

  return (
    <div className="appearance-studio" data-testid="design-settings-panel">
      <div className="studio-head">
        <div className="flex items-start gap-3">
          <span className="studio-head__icon"><Palette size={18} /></span>
          <div>
            <h2 className="studio-head__title">Appearance studio</h2>
            <p className="studio-head__copy">Tune the surface and the way it answers your cursor. Changes apply as you go.</p>
          </div>
        </div>
        <span className="studio-tier">TIER {tier}</span>
      </div>

      <div className="studio-grid">
        <section className="studio-rack" aria-label="Interface modes">
          <div className="studio-section-head">
            <h3>Interface mode</h3>
            <span>{INTERFACE_MODES.length} surfaces</span>
          </div>
          <div className="studio-modes">
            {INTERFACE_MODES.map((m) => {
              const Icon = MODE_ICONS[m.id] || Waves;
              const minTier = snap?.modeGates?.[m.id] ?? m.minTier;
              const locked = minTier > tier;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => chooseMode(m)}
                  disabled={saving}
                  onMouseEnter={() => setHoverMode(m.id)}
                  onMouseLeave={() => setHoverMode(null)}
                  onFocus={() => setHoverMode(m.id)}
                  onBlur={() => setHoverMode(null)}
                  aria-pressed={active}
                  aria-disabled={locked}
                  className={`studio-mode ${active ? "is-active" : ""} ${locked ? "is-locked" : ""} ${previewMode === m.id ? "is-preview" : ""}`}
                  data-slop-allow="overstuffed-row"
                  data-testid={`design-mode-${m.id}`}
                >
                  <span className="studio-mode__glyph">
                    <Icon size={16} />
                    <em>T{minTier}+</em>
                  </span>
                  <span className="studio-mode__body">
                    <b>{m.name}</b>
                  </span>
                  <span className="studio-mode__state">
                    {locked ? <Lock size={13} /> : active ? <Check size={14} /> : <ArrowUpRight size={13} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="studio-stage" aria-label="Live appearance preview">
          <div className="studio-section-head">
            <h3>Live preview</h3>
            <span>{hoverMode ? "PREVIEWING" : "APPLIED"}</span>
          </div>
          <div
            className="studio-preview"
            data-mode={previewMode}
            data-material={material}
            style={previewStyle}
            data-testid="design-preview"
            data-preview-mode={previewMode}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return;
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
            }}
            onMouseLeave={() => { setHoverMode(null); setHoverAccent(null); }}
          >
            <span className="preview-brackets"><i /><i /><i /><i /></span>
            <div className="studio-preview__chrome">
              <span className="preview-dots"><i /><i /><i /></span>
              <span>OBSIDIAN VANE</span>
              <span className="preview-live"><b /> PREVIEW</span>
            </div>
            <p className="preview-note">{previewModeInfo.desc}</p>
            <div className="studio-preview__stage">
              <div className="preview-metric">
                <span>SIGNAL</span>
                <b>+2.84%</b>
              </div>
              <svg className="preview-wave" viewBox="0 0 320 72" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="studio-wave-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--a)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--a)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="wave-area" d="M0 54 C40 48 56 58 88 43 S146 20 178 34 S238 54 268 26 S302 18 320 12 L320 72 L0 72Z" fill="url(#studio-wave-fill)" />
                <path className="wave-line" d="M0 54 C40 48 56 58 88 43 S146 20 178 34 S238 54 268 26 S302 18 320 12" />
                <path className="wave-draw" d="M0 54 C40 48 56 58 88 43 S146 20 178 34 S238 54 268 26 S302 18 320 12" />
              </svg>
              <div className="preview-rows">
                {ROWS.map((r) => (
                  <span className="preview-row" key={r.sym}>
                    <b>{r.sym}</b><i style={{ width: `${r.w}%` }} /><em className={r.move >= 0 ? "bull" : "bear"}>{r.move >= 0 ? "+" : ""}{r.move.toFixed(2)}%</em>
                  </span>
                ))}
              </div>
              <div className="preview-actions"><span>Deploy</span><span>Review</span></div>
            </div>
            <div className="studio-preview__telemetry">
              <span><b>{material.toUpperCase()}</b> SURFACE</span>
              <span><b>{MODE_SIGNAL[previewMode]}</b> CURSOR</span>
              <span><b>{Math.round(motion * 100)}%</b> MOTION</span>
            </div>
          </div>
        </section>
      </div>

      <div className="studio-controls">
        <section className="studio-controls__col" aria-label="Accent colour">
          <div className="studio-section-head">
            <h3>Accent colour</h3>
            <span>{tier >= 5 ? "5 colours" : "T5 unlock"}</span>
          </div>
          {tier >= 5 ? (
            <div className="studio-pucks">
              <button
                type="button"
                onClick={() => chooseAccent("")}
                disabled={saving}
                onMouseEnter={() => setHoverAccent("")}
                onMouseLeave={() => setHoverAccent(null)}
                onFocus={() => setHoverAccent("")}
                onBlur={() => setHoverAccent(null)}
                className={`studio-puck ${accent === "" ? "is-active" : ""}`}
                style={{ "--puck": pair[0], "--puck2": pair[1] }}
                data-testid="design-accent-auto"
              >
                <i /><span>Auto</span>{accent === "" && <Check size={11} />}
              </button>
              {ACCENT_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => chooseAccent(a.id)}
                  disabled={saving}
                  onMouseEnter={() => setHoverAccent(a.id)}
                  onMouseLeave={() => setHoverAccent(null)}
                  onFocus={() => setHoverAccent(a.id)}
                  onBlur={() => setHoverAccent(null)}
                  className={`studio-puck ${accent === a.id ? "is-active" : ""}`}
                  style={{ "--puck": ACCENTS[a.id], "--puck2": ACCENT_PAIRS[a.id]?.[1] || ACCENTS[a.id] }}
                  data-testid={`design-accent-${a.id}`}
                >
                  <i /><span>{a.label}</span>{accent === a.id && <Check size={11} />}
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="studio-locked" onClick={() => upgrade(5)}>
              <Lock size={14} /><span>Accent colours unlock at T5</span><ArrowUpRight size={13} />
            </button>
          )}
        </section>

        <section className="studio-controls__col" aria-label="Signal response">
          <div className="studio-section-head">
            <h3>Signal response</h3>
            <span>{Math.round(motion * 100)}%</span>
          </div>
          <div className="studio-slider">
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(motion * 100)}
              onChange={(e) => queueMotion(Number(e.currentTarget.value) / 100)}
              onBlur={(e) => flushMotion(Number(e.currentTarget.value) / 100)}
              className="studio-range"
              style={{ "--fill": `${Math.round(motion * 100)}%` }}
              data-testid="design-motion-range"
              aria-label="Cursor signal strength"
            />
            <div className="studio-slider__marks"><span>Calm</span><span>Balanced</span><span>Full</span></div>
          </div>
        </section>
      </div>

      <section className="studio-controls__col" aria-label="Cursor lag">
        <div className="studio-section-head">
          <h3>Cursor lag</h3>
          <span>0 = instant, 0.3 = smooth</span>
        </div>
        <div className="studio-slider">
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            value={cursorLag}
            onChange={(e) => setCursorLag(Number(e.currentTarget.value))}
            className="studio-range"
            style={{ "--fill": `${cursorLag}` }}
            data-testid="design-cursor-lag"
            aria-label="Cursor lag"
          />
          <div className="studio-slider__marks"><span>None</span><span>Small</span><span>Full</span></div>
        </div>
      </section>

      <p className="studio-footnote">Appearance is visual only. Features still follow your tier.</p>
    </div>
  );
};

export default DesignSettings;
