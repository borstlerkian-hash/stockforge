import re

path = r"C:\Users\fritj\Documents\Default Project\stockforge-extract\stockforge\frontend\src\pages\Terminal.jsx"
content = open(path, encoding='utf-8').read()

start = content.index("const Boot = () => {")
end = content.index("const PreviewBar", start)
old_boot = content[start:end]

new_boot = '''const Boot = () => {
  const [show, setShow] = useState(() => { try { return !sessionStorage.getItem("sf_booted"); } catch { return false; } });
  const [leaving, setLeaving] = useState(false);
  const [stage, setStage] = useState(0);
  const [showCredit, setShowCredit] = useState(false);
  useEffect(() => {
    if (!show) return;
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 400));
    timers.push(setTimeout(() => setStage(2), 1400));
    timers.push(setTimeout(() => setStage(3), 2600));
    timers.push(setTimeout(() => setShowCredit(true), 3800));
    timers.push(setTimeout(() => setLeaving(true), 6200));
    timers.push(setTimeout(() => { try { sessionStorage.setItem("sf_booted", "1"); } catch { /* ignore */ } setShow(false); }, 6800));
    return () => timers.forEach(clearTimeout);
  }, [show]);
  if (!show) return null;
  const siteName = (() => { try { return JSON.parse(localStorage.getItem("sf_site_name") || "null"); } catch { return null; } })() || "STOCKFORGE";
  return (
    <>
      <div className={`fixed inset-0 z-[100] bg-[#050510] grid place-items-center overflow-hidden ${leaving ? "boot-out" : ""}`} data-testid="boot-screen">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="absolute top-0 font-mono text-[10px] text-green-400/50 leading-none" style={{ left: (i * 5.6) + "%", animation: "matrix-rain " + (2.5 + (i % 3) * 0.7) + "s linear infinite", animationDelay: ((i * 0.4) % 2.5) + "s" }}>
              {Array.from({ length: 16 }).map((_, j) => (
                <div key={j} style={{ opacity: Math.random() * 0.5 + 0.2 }}>{String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" style={{ animation: "scan-line 3s linear infinite" }} />
        <div className="relative z-10 w-80 text-center space-y-5">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse" style={{ background: "var(--a)" }} />
            <svg viewBox="0 0 64 64" className="relative w-full h-full" style={{ animation: "spin 4s linear infinite" }}>
              <polygon points="32,4 58,18 58,46 32,60 6,46 6,18" fill="none" stroke="var(--a)" strokeWidth="2" opacity="0.9" />
              <polygon points="32,12 50,22 50,42 32,52 16,42 16,22" fill="none" stroke="var(--a)" strokeWidth="1" opacity="0.4" />
              <circle cx="32" cy="32" r="6" fill="var(--a)" opacity="0.9">
                <animate attributeName="r" values="4;10;4" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="32" cy="32" r="3" fill="#ffffff" opacity="0.95">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div className={`transition-all duration-700 ${stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <p className="font-disp text-4xl font-bold tracking-[0.2em] text-white">{siteName}</p>
            <p className="font-mono text-[10px] tracking-[0.35em] accent mt-1">NEURAL TERMINAL · v3</p>
          </div>
          <div className={`transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
            <p className="font-mono text-xs text-neutral-400 mt-2 caret">{stage >= 3 ? "systems online" : "linking market feeds"}</p>
            <div className="boot-bar h-[2px] bg-white/5 mt-3 overflow-hidden rounded-full"><i className="block h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ animation: "boot 1.5s ease forwards" }} /></div>
          </div>
          <div className={`flex justify-center gap-2 mt-2 transition-all duration-500 ${stage >= 2 ? "opacity-100" : "opacity-0"}`}>
            {["INIT", "AUTH", "FEEDS", "READY"].map((s, i) => (
              <span key={s} className={`font-mono text-[9px] tracking-widest px-2 py-0.5 rounded border transition-all duration-300 ${stage > i ? "border-cyan-400/40 text-cyan-400 bg-cyan-400/10" : "border-white/10 text-neutral-600"}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      {showCredit && (
        <div className={`fixed inset-0 z-[101] flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
          <div className={`relative bg-[#0a0a14]/95 border border-cyan-500/30 rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4 shadow-[0_0_60px_rgba(0,255,255,0.15)] transition-all duration-500 ${leaving ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent" />
            </div>
            <HackerAvatar size={96} className="mx-auto" />
            <div>
              <p className="font-disp text-3xl font-bold tracking-[0.15em] text-white">CREATED BY KIKI</p>
              <p className="font-mono text-[10px] tracking-widest text-cyan-400 mt-2">DESIGNER · DEVELOPER · HACKER</p>
            </div>
            <div className="flex items-center justify-center gap-1.5 font-mono text-[9px] text-neutral-500 tracking-widest">
              <span className="pulse-dot" />
              <span>INITIALIZING NEURAL TERMINAL</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

'''

content = content[:start] + new_boot + content[end:]

# Add CSS keyframes if not present
css_path = r"C:\Users\fritj\Documents\Default Project\stockforge-extract\stockforge\frontend\src\index.css"
css = open(css_path, encoding='utf-8').read()
if "matrix-rain" not in css:
    css += "\n@keyframes matrix-rain { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }\n"
    css += "@keyframes scan-line { 0% { top: -2px; } 100% { top: 100%; } }\n"
    open(css_path, 'w', encoding='utf-8').write(css)

open(path, 'w', encoding='utf-8').write(content)
print("Done! Boot component updated successfully.")