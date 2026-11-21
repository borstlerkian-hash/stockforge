import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/ui/themes";

const appearance = {
  theme: dark,
  captcha: { theme: "dark" },
  variables: {
    colorPrimary: "#ef4444",
    colorBackground: "#0D131F",
    colorInput: "#080E18",
    fontFamily: "Geist, sans-serif",
    borderRadius: "8px",
  },
};

const BACKEND_URL = "";

// Static builds ship without a backend: VITE_STATIC_DEMO=true skips the config
// poll entirely and flags auth as unavailable so routes render their fallbacks.
export const ClerkUnavailableContext = createContext(false);
export const useClerkUnavailable = () => useContext(ClerkUnavailableContext);

export default function ClerkAuthProvider({ children }) {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (import.meta.env.VITE_STATIC_DEMO === "true") {
      setUnavailable(true);
      return;
    }
    let cancelled = false;
    const load = async (attempt = 0) => {
      try {
        const cfg = await (await fetch(`${BACKEND_URL}/api/clerk/config`)).json();
        if (cfg.enabled) return cancelled || setConfig(cfg);
      } catch {}
      if (cancelled) return;
      if (attempt >= 20) return setUnavailable(true);
      setTimeout(() => load(attempt + 1), 1500);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (unavailable) return <ClerkUnavailableContext.Provider value>{children}</ClerkUnavailableContext.Provider>;
  if (!config) return null;
  return (
    <ClerkProvider
      publishableKey={config.publishable_key}
      proxyUrl={config.proxy_url || undefined}
      appearance={appearance}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
