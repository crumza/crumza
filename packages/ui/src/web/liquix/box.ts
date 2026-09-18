import { type RefCallback, type RefObject, useContext, useEffect, useMemo, useRef } from 'react';
import { LiquixStageContext, type LiquixShapeEntry, type LiquixStageValue } from './stage';

/** A box's shape, mutable so a caller can animate it every frame for nothing. */
export interface LiquixBoxShape {
  width: number;
  height: number;
  cornerRadius: number;
  /** Superellipse exponent: 2 is a circular corner, 4 to 6 squares it off. */
  roundness: number;
}

/** One registered box. The frame loop reads and writes it directly. */
export interface LiquixBoxEntry extends LiquixShapeEntry {
  shape: LiquixBoxShape;
  layer: number;
}

/** A callback ref that also remembers its element, so it can be passed as `ref` and read from. */
export type LiquixElementRef<T extends HTMLElement> = RefCallback<T> & { current: T | null };

export interface LiquixBoxHandle<T extends HTMLElement = HTMLDivElement> {
  /**
   * Hang this on the element whose box the glass takes. It attaches the
   * element to the shape whenever it mounts, so a panel that appears after
   * the hook ran is drawn where it is, not where nothing is.
   */
  readonly elementRef: LiquixElementRef<T>;
  /** The registered entry, for animating its shape or glow per frame. */
  readonly entryRef: RefObject<LiquixBoxEntry>;
  /** The surrounding host, for registering and unregistering by hand. */
  readonly stage: LiquixStageValue | null;
  /** True when there is no shader to draw the box, so it draws itself in CSS. */
  readonly fallback: boolean;
}

/**
 * Registers one box with the surrounding surface and hands back the ref to
 * hang on the element that defines it. The element stays transparent: its job
 * is to say where the glass goes, and the shader draws the surface itself on
 * the canvas underneath.
 *
 * `layer` is what keeps nested glass apart. The shader merges every shape in a
 * pass into one distance field with min(), so a pill inside a bar would be
 * swallowed by it: inside the bar, the bar is always the deeper shape. Shapes
 * on different layers are drawn in separate passes, each refracting the one
 * below.
 *
 * The entry is a plain mutable object the frame loop reads, not React state,
 * so a caller can animate its shape every frame for nothing.
 */
export function useLiquixBox<T extends HTMLElement = HTMLDivElement>(
  layer = 0,
): LiquixBoxHandle<T> {
  const stage = useContext(LiquixStageContext);
  const entryRef = useRef<LiquixBoxEntry>({
    el: null,
    label: null,
    shape: { width: 0, height: 0, cornerRadius: 0, roundness: 2 },
    scale: 1,
    scaleTarget: 1,
    glow: 0,
    glowTarget: 0,
    alpha: 1,
    clarity: 1,
    shadow: 0,
    layer,
  });

  const elementRef = useMemo<LiquixElementRef<T>>(() => {
    const attach = ((node: T | null) => {
      attach.current = node;
      entryRef.current.el = node;
    }) as LiquixElementRef<T>;
    attach.current = null;
    return attach;
  }, []);

  useEffect(() => {
    if (!stage) return;
    const entry = entryRef.current;
    entry.el = elementRef.current;
    entry.layer = layer;
    stage.register(entry);
    return () => stage.unregister(entry);
  }, [stage, layer, elementRef]);

  return { elementRef, entryRef, stage, fallback: stage?.fallback ?? true };
}
