import { Download } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AdminAccess } from "@/components/sf/AdminAccess";
import { DesignSettings } from "@/components/sf/DesignSettings";

export const SettingsDrawer = ({ open, onOpenChange, onInstall }) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="studio-drawer bg-[#080B12] border-l border-[var(--a-line)] w-full sm:max-w-3xl overflow-y-auto" data-testid="settings-drawer">
      <SheetHeader>
        <SheetTitle className="font-disp text-3xl text-left">Settings</SheetTitle>
        <SheetDescription className="text-left">Tune the terminal to your desk. Appearance, access and installation live here.</SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        <DesignSettings />
        <AdminAccess onDone={() => onOpenChange(false)} />
        {onInstall && (
          <button className="sf-btn w-full" onClick={() => { onOpenChange(false); onInstall(); }} data-testid="settings-install-button">
            <Download size={14} /> Install app
          </button>
        )}
      </div>
    </SheetContent>
  </Sheet>
);

export default SettingsDrawer;
