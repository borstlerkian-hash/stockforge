// Interface modes are visual only. Feature gates live in the backend GATES map.
// Keep this list in sync with backend/data.py (INTERFACE_MODES / MODE_MIN_TIER).
export const INTERFACE_MODES = [
  {
    id: "professional",
    name: "Professional",
    minTier: 1,
    desc: "Flat surfaces, sharp edges and a precise caliper that answers the pointer.",
  },
  {
    id: "smooth",
    name: "Smooth",
    minTier: 1,
    desc: "Soft edges, gentle fades and a calm halo that widens on approach.",
  },
  {
    id: "water",
    name: "Water",
    minTier: 4,
    desc: "Liquid gradients, deep glass and ripples that spread from the cursor.",
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    minTier: 7,
    desc: "HUD grid, scanlines and a reticle that scans when you close in.",
  },
  {
    id: "singularity",
    name: "Singularity",
    minTier: 10,
    desc: "Dense particles, orbital rings and a gravity well at the cursor.",
  },
];

// The surface each mode is drawn from. Used by the preview and the cursor signal field.
export const MODE_MATERIAL = {
  professional: "alloy",
  smooth: "glass",
  water: "liquid",
  scifi: "metal",
  singularity: "plasma",
};

export const DEFAULT_MODE = "smooth";

export const modeById = (id) => INTERFACE_MODES.find((m) => m.id === id) || INTERFACE_MODES[1];

export const modeMinTier = (id) => modeById(id).minTier;
