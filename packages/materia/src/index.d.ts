export interface Effect {
  readonly name: string;
  readonly kind: "gpu" | "signal" | "physics" | "elements" | "glyphs" | "stack";
}
export interface SignalEffect extends Effect {
  readonly kind: "signal";
}
export interface TextEffectOptions {
  effect: Effect;
  /** GPU shape + optional signal treatment. Canvas families cannot be chained yet. */
  signal?: SignalEffect;
  /** Ancestor providing the canvas bounds. Defaults to the text's parent. */
  host?: HTMLElement;
  /** 0–1. Defaults to 0.7. */
  strength?: number;
  /** 1–24. Defaults to 10. */
  scale?: number;
  signalStrength?: number;
  signalScale?: number;
  auto?: boolean;
  frozen?: boolean;
  /** Elemental effects only. */
  consumed?: boolean;
  /** Waterfall pool surface as a fraction of host height (0.4–0.9). Enables reflection and impact ripples. */
  waterline?: number;
  /** GPU text color: CSS color (including OKLCH) or sRGB channels in 0–1. Alpha is not applied. */
  color?: string | [number, number, number];
  /** CSS letter spacing; numbers are pixels. Defaults to the element's CSS. */
  letterSpacing?: string | number;
}
export interface TextEffectController {
  readonly supported: boolean;
  refresh(): void;
  setLetterSpacing(value: string | number): void;
  setLayer(
    index: number,
    changes: { strength?: number; scale?: number; enabled?: boolean },
  ): void;
  pulse(): void;
  setStrength(value: number): void;
  setScale(value: number): void;
  setAuto(value: boolean): void;
  setFrozen(value: boolean): void;
  setConsumed(value: boolean): void;
  setWaterline(value: number): void;
  /** Scrub element consumption from intact (0) to consumed (1); null resumes time. */
  setConsumptionProgress(value: number | null): void;
  /** Adjust an already-attached signal treatment. */
  setSignal(strength: number, scale?: number): void;
  /** Idempotent; releases observers, events, GPU resources, and owned styles. */
  destroy(): void;
}
/** Import-safe in SSR. Call only on a connected, plain-text browser element. */
export function createTextEffect(
  element: HTMLElement,
  options: TextEffectOptions,
): TextEffectController;
