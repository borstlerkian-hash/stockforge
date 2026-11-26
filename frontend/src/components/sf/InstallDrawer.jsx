import { Download, ExternalLink, Monitor, Smartphone, Apple, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useInstall, platform } from "@/hooks/useInstall";

const STEPS = {
  ios: { icon: Apple, title: "iPhone / iPad", steps: ["Open this site in Safari", "Tap Share, then Add to Home Screen", "Tap Add. It opens full-screen like a native app"] },
  android: { icon: Smartphone, title: "Android", steps: ["Open this site in Chrome", "Tap the menu, then Install app", "Launch it from your home screen"] },
  desktop: { icon: Monitor, title: "Windows / Mac / Linux", steps: ["Open this site in Chrome or Edge", "Click the install icon in the address bar", "Confirm Install, then pin it to your taskbar"] },
};

export const InstallDrawer = ({ open, onOpenChange, extra }) => {
  const { canPrompt, prompt, installed, inFrame } = useInstall();
  const me = platform();
  const others = Object.keys(STEPS).filter((k) => k !== me);

  const install = async () => {
    if (await prompt()) {
      toast.success("Obsidian Vane installed");
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-[#070707] border-l border-[var(--a-line)] w-full sm:max-w-md overflow-y-auto" data-testid="install-drawer">
        <SheetHeader>
          <SheetTitle className="font-disp text-3xl text-left">Download Obsidian Vane</SheetTitle>
          <SheetDescription className="text-left">Install the terminal on your phone or computer. It opens in its own window, works offline with your last saved prices and updates itself.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {installed ? (
            <div className="sf-panel p-4 flex items-center gap-3" data-testid="install-already-installed"><CheckCircle2 className="bull" /> You're running the installed app.</div>
          ) : canPrompt ? (
            <button className="sf-btn sf-btn-p w-full !py-4 !text-sm" onClick={install} data-testid="install-now-button"><Download size={18} /> Install Obsidian Vane now</button>
          ) : inFrame ? (
            <button className="sf-btn sf-btn-p w-full !py-4 !text-sm" onClick={() => window.open(window.location.href, "_blank", "noopener")} data-testid="install-open-tab-button">
              <ExternalLink size={18} /> Open in a new tab to install
            </button>
          ) : (
            <p className="text-sm text-neutral-400" data-testid="install-manual-hint">Your browser doesn't offer one-tap install here. Follow the steps for your device below.</p>
          )}
          {extra}
          {[me, ...others].map((k, idx) => {
            const S = STEPS[k];
            const steps = (
              <ol className="space-y-2 text-sm text-neutral-300">
                {S.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="font-mono accent">0{i + 1}</span><span>{s}</span></li>)}
              </ol>
            );
            if (idx > 0) return null;
            return (
              <div key={k} className="sf-panel p-4" data-testid={`install-steps-${k}`}>
                <div className="flex items-center gap-2 mb-3"><S.icon size={16} className="accent" /><span className="font-disp text-lg">{S.title}</span><span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">This device</span></div>
                {steps}
              </div>
            );
          })}
          {others.length > 0 && (
            <details className="sf-panel p-4" data-testid="install-other-devices">
              <summary className="font-disp text-lg cursor-pointer list-none">Other devices</summary>
              <div className="mt-4 space-y-4">
                {others.map((k) => {
                  const S = STEPS[k];
                  return (
                    <div key={k} data-testid={`install-steps-${k}`}>
                      <div className="flex items-center gap-2 mb-2"><S.icon size={15} className="accent" /><span className="font-disp text-base">{S.title}</span></div>
                      <ol className="space-y-1.5 text-sm text-neutral-400">
                        {S.steps.map((s, i) => <li key={s} className="flex gap-3"><span className="font-mono accent">0{i + 1}</span><span>{s}</span></li>)}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
