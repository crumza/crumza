import {
  type Context,
  createContext,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

/** The resolved box a shape hands to the shader. Lengths are CSS pixels. */
export interface LiquixShape {
  readonly width: number;
  readonly height: number;
  readonly cornerRadius: number;
  /** Superellipse exponent: 2 is a circular corner, 4 to 6 squares it off. */
  readonly roundness: number;
}

/**
 * One registered shape. The render loop reads and writes this object directly
 * each frame, so an interaction costs no re-render.
 */
export interface LiquixShapeEntry {
  el: HTMLElement | null;
  label: HTMLElement | null;
  shape: LiquixShape;
  scale: number;
  scaleTarget: number;
  glow: number;
  glowTarget: number;
}

export interface LiquixStageValue {
  register(entry: LiquixShapeEntry): void;
  unregister(entry: LiquixShapeEntry): void;
  /** True when there is no WebGL2 pipeline, so shapes draw themselves in CSS. */
  readonly fallback: boolean;
}

/**
 * Set by LiquixStage. Shapes use it to hand their box to the shader pipeline;
 * the stage renders every registered shape as one field of glass.
 */
export const LiquixStageContext: Context<LiquixStageValue | null> =
  createContext<LiquixStageValue | null>(null);

export type LiquixInteraction = 'idle' | 'hover' | 'press';

export interface LiquixShapeHandle {
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly labelRef: RefObject<HTMLSpanElement | null>;
  setInteraction(state: LiquixInteraction): void;
  readonly fallback: boolean;
}

/**
 * Registers one shape with the surrounding stage and returns the refs a button
 * needs to wire up.
 *
 * Hovering or pressing nudges scaleTarget and the loop eases towards it, and
 * the shader reads the glow to brighten the rim of this shape alone, so a
 * hovered button lights up without touching its neighbours.
 */
export function useLiquixShape(shape: LiquixShape): LiquixShapeHandle {
  const stage = useContext(LiquixStageContext);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const entryRef = useRef<LiquixShapeEntry>({
    el: null,
    label: null,
    shape,
    scale: 1,
    scaleTarget: 1,
    glow: 0,
    glowTarget: 0,
  });

  useEffect(() => {
    entryRef.current.shape = shape;
  }, [shape]);

  useEffect(() => {
    if (!stage) return;
    const entry = entryRef.current;
    entry.el = buttonRef.current;
    entry.label = labelRef.current;
    stage.register(entry);
    return () => stage.unregister(entry);
  }, [stage]);

  const setInteraction = useCallback((state: LiquixInteraction) => {
    const entry = entryRef.current;
    entry.scaleTarget = state === 'press' ? 0.95 : state === 'hover' ? 1.04 : 1;
    entry.glowTarget = state === 'press' ? 1 : state === 'hover' ? 0.45 : 0;
  }, []);

  // With no stage above it a button has no shader to draw it, so it falls back
  // to the CSS approximation on its own.
  return { buttonRef, labelRef, setInteraction, fallback: stage?.fallback ?? true };
}
