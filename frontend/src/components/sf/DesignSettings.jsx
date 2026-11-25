import { useEffect, useState } from "react";
import { Briefcase, Check, Droplets, Lock, Orbit, Palette, Sparkles, Waves } from "lucide-react";
import { useSF } from "@/context/SFContext";
import { ACCENTS, ACCENT_OPTIONS } from "@/lib/theme";
import { DEFAULT_MODE, INTERFACE_MODES } from "@/lib/interfaceModes";
import { toast } from "sonner";

const MODE_ICONS = {
  professional: Briefcase,
  smooth: Waves,
  water: Droplets,
  scifi: Orbit,
  singularity: Sparkles,
};

export const DesignSettings = () => {
  const { me, api, setMe, snap, upgrade, interfaceMode } = useSF();
  const [accent, setAccent] = useState(me?.design?.accent || "");
  const [saving, setSaving] = useState(false);

  // `me` arrives after the first render, so sync once the saved preferences are known.
  useEffect(() => { setAccent(me?.design?.accent || ""); }, [me?.design?.accent]);

  if (!me) return null;

  const tier = me.tier || 1;
  const mode = interfaceMode || me.design?.mode || DEFAULT_MODE;

  const save = async (patch, message) => {
    setSaving(true);
    try {
      const design = await api.put("/me/design", patch);
      setMe((m) => m && { ...m, design: { ...(m.design || {}), ...(design || patch) } });
      toast.success(message);
      return true;
    } catch (e) {
      toast.error(e.message);
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
    await save({ mode: m.id }, `${m.name} mode on`);
  };

  const chooseAccent = async (id) => {
    if (id === accent) return;
    const previous = accent;
    setAccent(id);
    const ok = await save({ accent: id }, id ? `${ACCENT_OPTIONS.find((a) => a.id === id)?.label || "Accent"} accent on` : "Using the tier colour");
    if (!ok) setAccent(previous);
  };

  return (
    <div className="sf-panel p-4" data-testid="design-settings-panel">
      <div className="flex items-center gap-2 mb-1">
        <Palette size={16} className="accent" />
        <span className="font-disp text-lg">Appearance</span>
        <span className="font-mono text-[9px] text-neutral-500 ml-auto">T{tier}</span>
      </div>
      <p className="text-sm text-neutral-400 mb-4">Choose how the terminal looks and moves. Rarer modes unlock as you climb.</p>

      <div className="lab !mb-2">Interface mode</div>
      <div className="grid gap-2 sm:grid-cols-2">
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
              aria-pressed={active}
              aria-disabled={locked}
              className={`mode-card ${active ? "mode-card-on" : ""} ${locked ? "mode-card-locked" : ""}`}
              data-testid={`design-mode-${m.id}`}
            >
              <span className="flex items-center gap-2">
                <Icon size={15} className={active ? "accent" : "text-neutral-400"} />
                <span className="font-disp text-sm">{m.name}</span>
                <span className="ml-auto text-neutral-500">
                  {locked ? <Lock size={12} /> : active ? <Check size={13} className="accent" /> : null}
                </span>
              </span>
              <span className="block text-[11px] leading-snug text-neutral-500 mt-1">{m.desc}</span>
              <span className="block font-mono text-[9px] tracking-[0.18em] text-neutral-600 mt-2">T{minTier}+</span>
            </button>
          );
        })}
      </div>

      {tier >= 5 ? (
        <div className="mt-4">
          <div className="lab !mb-2">Accent colour</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => chooseAccent("")}
              disabled={saving}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${accent === "" ? "border-[var(--a)] bg-[var(--a-soft)]" : "border-white/10 hover:border-white/20"}`}
              data-testid="design-accent-auto"
            >
              <span className="w-4 h-4 rounded-full" style={{ background: "linear-gradient(135deg, var(--a), var(--a2))" }} />
              <span className="font-mono text-xs">Auto</span>
              {accent === "" && <Check size={12} className="accent" />}
            </button>
            {ACCENT_OPTIONS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => chooseAccent(a.id)}
                disabled={saving}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${accent === a.id ? "border-[var(--a)] bg-[var(--a-soft)]" : "border-white/10 hover:border-white/20"}`}
                data-testid={`design-accent-${a.id}`}
              >
                <span className="w-4 h-4 rounded-full" style={{ background: ACCENTS[a.id], boxShadow: `0 0 8px ${ACCENTS[a.id]}40` }} />
                <span className="font-mono text-xs">{a.label}</span>
                {accent === a.id && <Check size={12} className="accent" />}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-neutral-600 mt-4">Accent colours unlock at T5.</p>
      )}
    </div>
  );
};

export default DesignSettings;
