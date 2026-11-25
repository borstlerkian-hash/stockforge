// Interface modes are visual only. Feature gates live in the backend GATES map.
// Keep this list in sync with backend/data.py (INTERFACE_MODES / MODE_MIN_TIER).
export const INTERFACE_MODES = [
  {
    id: "professional",
    name: "Professional",
    minTier: 1,
    desc: "Flat surfaces, sharp edges and no ambient motion.",
  },
  {
    id: "smooth",
    name: "Smooth",
    minTier: 1,
    desc: "Soft edges, gentle fades and a calm background drift.",
  },
  {
    id: "water",
    name: "Water",
    minTier: 4,
    desc: "Liquid gradients, deep glass and slow, weightless movement.",
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    minTier: 7,
    desc: "HUD grid, scanlines and a cold signal glow.",
  },
  {
    id: "singularity",
    name: "Singularity",
    minTier: 10,
    desc: "Dense particles, orbital rings and a full void backdrop.",
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
