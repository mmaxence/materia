import type { Effect } from "./index.js";
export interface Layer {
  effect: Effect;
  strength?: number;
  scale?: number;
  enabled?: boolean;
}
export const MAX_LAYERS: 6;
export function stack(layers: Layer[]): Effect;
