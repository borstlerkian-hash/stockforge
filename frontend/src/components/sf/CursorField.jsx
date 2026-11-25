import { useEffect, useRef } from "react";

// A single pointer-driven field. It follows the cursor with a soft lag and changes
// shape/energy with the selected interface mode. It never handles pointer events.
const TARGETS = 'a, button, [role="button"], [role="tab"], input, select, textarea, .sf-panel, tr, [data-hover-signal]';

export const CursorField = () => {
  const ref = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = -200;
    let y = -200;
    let tx = -200;
    let ty = -200;
    let active = false;

    const tick = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      el.dataset.visible = "true";
      if (!raf) raf = requestAnimationFrame(tick);

      const hit = e.target instanceof Element ? e.target.closest(TARGETS) : null;
      const next = !!hit;
      if (next !== active) {
        active = next;
        el.dataset.active = String(next);
      }
      if (hit) {
        const label = hit.dataset.signal || hit.getAttribute("aria-label") || hit.textContent || "";
        el.dataset.label = label.trim().slice(0, 22);
      }
    };

    const hide = () => { el.dataset.visible = "false"; };
    const press = () => { el.dataset.pressed = "true"; };
    const release = () => { el.dataset.pressed = "false"; };
    const onOut = (e) => { if (!e.relatedTarget) hide(); };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("mouseout", onOut);
    document.addEventListener("mouseleave", hide);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("blur", hide);
      window.removeEventListener("mouseout", onOut);
      document.removeEventListener("mouseleave", hide);
    };
  }, []);

  return (
    <div ref={ref} className="cursor-field" data-visible="false" data-active="false" data-pressed="false" aria-hidden="true">
      <i className="cf-core" />
      <i className="cf-ring" />
      <i className="cf-ticks" />
      <i className="cf-label" />
    </div>
  );
};

export default CursorField;
