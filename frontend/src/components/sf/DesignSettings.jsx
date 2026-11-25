import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useSF } from "@/context/SFContext";
import { toast } from "sonner";

const ACCENTS = [
  { id: "red", label: "Red", color: "#ef4444" },
  { id: "cyan", label: "Cyan", color: "#00F0FF" },
  { id: "emerald", label: "Emerald", color: "#10B981" },
  { id: "amber", label: "Amber", color: "#F59E0B" },
  { id: "violet", label: "Violet", color: "#8B5CF6" },
];

export const DesignSettings = () => {
  const { me, api, setMe } = useSF();
  const [accent, setAccent] = useState(me?.design?.accent || "red");
  const [saving, setSaving] = useState(false);

  // `me` arrives after the first render, so sync once the saved accent is known.
  useEffect(() => { if (me?.design?.accent) setAccent(me.design.accent); }, [me?.design?.accent]);

  if (!me || (me.tier || 1) < 5) return null;

  const save = async (newAccent) => {
    setAccent(newAccent);
    setSaving(true);
    try {
      await api.put("/me/design", { accent: newAccent });
      setMe((m) => m && { ...m, design: { ...(m.design || {}), accent: newAccent } });
      toast.success("Design updated");
      // Apply accent color
      const a = ACCENTS.find((x) => x.id === newAccent);
      if (a) {
        document.documentElement.style.setProperty("--a", a.color);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sf-panel p-4" data-testid="design-settings-panel">
      <div className="flex items-center gap-2 mb-3">
        <Palette size={16} className="accent" />
        <span className="font-disp text-lg">Design settings</span>
        <span className="font-mono text-[9px] text-neutral-500 ml-auto">TIER 5+</span>
      </div>
      <p className="text-sm text-neutral-400 mb-3">Customize your terminal's accent color.</p>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => save(a.id)}
            disabled={saving}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${accent === a.id ? "border-[var(--a)] bg-[var(--a-soft)]" : "border-white/10 hover:border-white/20"}`}
            data-testid={`design-accent-${a.id}`}
          >
            <span className="w-4 h-4 rounded-full" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}40` }} />
            <span className="font-mono text-xs">{a.label}</span>
            {accent === a.id && <Check size={12} className="accent" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignSettings;