// Stable experiment IDs are shared by the catalogue and rendering engines.
export const ELEMENT_MODES = new Set([52, 53, 54, 62, 63, 65, 66]);
export const isElementMode = (mode) => ELEMENT_MODES.has(mode);
export const isGlyphMode = (mode) => mode >= 58 && mode <= 61;
export const engineFor = (mode) =>
  mode >= 49 ? "transformation" : mode >= 39 ? "particles" : "gpu";
