import { useEffect, useRef } from "react";

// The original pointer is the cursor. This layer only adds mode-specific
// reactions at the exact pointer position; there is no easing or trailing ghost.
const TARGETS = 'a, button, [role="button"], [role="tab"], input, select, textarea, .sf-panel, tr, [data-hover-signal]';
const HOVER_GAP = 110;

export const CursorField = ({ mode = "smooth", lag = 0 }) => {
  const cursorRef = useRef(null);
  const pulsesRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;

    const el = cursorRef.current;
    const layer = pulsesRef.current;
    if (!el || !layer) return;

    const root = document.documentElement;
    root.dataset.cursorReactive = "on";

    let active = false;
    let lastPulse = 0;

    // If a lag is set, a soft transition will smooth the pointer movement.
    if (lag > 0) {
      el.style.transition = `transform ${lag}s cubic-bezier(0.4, 0, 0.2, 1)`;
    }

    const pulse = (cx, cy, strong = false) => {
      const now = performance.now();
      if (!strong && now - lastPulse < HOVER_GAP) return;
      lastPulse = now;
      const p = document.createElement("i");
      p.className = `cf-pulse cf-pulse--${mode}${strong ? " is-strong" : ""}`;
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      p.addEventListener("animationend", () => p.remove(), { once: true });
      layer.appendChild(p);
      // Safety cleanup when animations are throttled or disabled.
      window.setTimeout(() => p.remove(), 1800);
    };

    const onMove = (e) => {
      // When a lag is active the transform animates from the previous position;
      // otherwise it snaps instantly.
      if (lag > 0) {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      } else {
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        // The transition set above will handle the easing when lag > 0.
      }
      el.dataset.visible = "true";

      const hit = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      const next = !!hit;
      if (next !== active) {
        active = next;
        el.dataset.active = String(next);
        if (next) pulse(e.clientX, e.clientY);
      }
      if (hit) {
        const label = hit.dataset.signal || hit.getAttribute("aria-label") || hit.textContent || "";
        el.dataset.label = label.trim().slice(0, 22);
      } else {
        el.dataset.label = "";
      }
    };

    const onDown = (e) => {
      el.dataset.pressed = "true";
      pulse(e.clientX, e.clientY, true);
    };
    const onUp = () => { el.dataset.pressed = "false"; };
    const hide = () => { el.dataset.visible = "false"; };
    const onOut = (e) => { if (!e.relatedTarget) hide(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("mouseout", onOut);
    document.addEventListener("mouseleave", hide);

    return () => {
      delete root.dataset.cursorReactive;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", hide);
      window.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", hide);
      layer.replaceChildren();
    };
  }, [mode, lag]);

  return (
    <>
      <div
        ref={cursorRef}
        className="cursor-field"
        data-mode={mode}
        data-visible="false"
        data-active="false"
        data-pressed="false"
        aria-hidden="true"
      >
        <i className="cf-aura" />
        <i className="cf-shape" />
        <i className="cf-core" />
        <i className="cf-label" />
      </div>
      <div ref={pulsesRef} className="cursor-pulses" aria-hidden="true" />
    </>
  );
};

export default CursorField;
