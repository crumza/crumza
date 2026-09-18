/* The scrolling backdrop strip.

   A liquix stage owns the window: its panels scroll with the page and the glass
   is fixed over them. A liquid scene is a box inside somebody's page, so it
   scrolls its own strip instead, and writes the offset to --lq-scroll on the
   stage. That property is the whole trick: every surface holds a CLONE of the
   scene, the clone inherits the property from the stage, and so the real strip
   and every refracted copy of it move on the same value, in the same frame,
   with nothing to keep in sync.

   The strip never traps the reader. Past either end a wheel is handed back to
   the page, and a drag scrolls the page first and only rubber-bands once the
   page itself has run out. */

/** Ms of quiet that ends a gesture. */
const IDLE = 90;
/** Ms of the throw's velocity that count towards where it is heading. */
const PROJECT = 90;
/** Ms time constant of the follow: how fast the strip closes on where it is
 *  heading. A wheel arrives as ragged deltas, 4px on one frame and 30 on the
 *  next, and a strip that takes them straight lurches by exactly that much.
 *  Easing towards the total instead turns the same input into one movement,
 *  and lands the snap onto a panel with it rather than as a separate spring. */
const EASE = 100;
/** How much of a drag past either end actually moves the strip. */
const RESIST = 0.32;
/** Lines and pages, for wheels that do not report pixels. */
const LINE = 16;

/** A press on any of these is the component's, not the strip's: the glass
 *  itself, anything you can operate, and anything a component has claimed. */
const HANDS_OFF = '.lq-lens, button, a, input, textarea, select, [role="slider"], [data-no-drag]';

export interface BackdropTrack {
  /** Panels in the strip. Below two there is nothing to scroll. */
  setCount(count: number): void;
  /** Settle on a panel, the way the end of a gesture would. */
  scrollTo(index: number): void;
  /** Advance the physics and write the offset. True while the strip moves. */
  step(now: number, dt: number): boolean;
  dispose(): void;
}

/** Wheel and touch deltas in CSS pixels, whatever units the device reports. */
function wheelPx(event: WheelEvent, page: number): number {
  if (event.deltaMode === 1) return event.deltaY * LINE;
  if (event.deltaMode === 2) return event.deltaY * page;
  return event.deltaY;
}

/**
 * Give a stage a strip of backdrops that scrolls behind its glass.
 *
 * `onIndex` fires when the strip settles on a different panel, so a caller can
 * keep a picker in step with what the reader scrolled to.
 */
export function createBackdropTrack(
  stage: HTMLElement,
  onIndex: (index: number) => void,
): BackdropTrack {
  let count = 0;
  let aim = 0; // px from the top of the strip that the scroll is heading for
  let pos = 0; // px it is showing; eases towards aim
  let vel = 0; // px per ms of input, averaged over the last deltas
  let snapped = true; // aim is a panel rather than a free offset
  let dragging = 0; // pointerId + 1 while a drag owns it
  let lastAt = 0; // ms of the last delta
  let lastY = 0;
  let painted = Number.NaN;
  let index = 0;
  let seeking = -1; // panel a scrollTo is on its way to
  let height = 0;

  const span = (): number => Math.max(0, (count - 1) * (stage.clientHeight || height));

  /** Bank a delta. Past either end the strip gets heavy rather than free. */
  const push = (delta: number, at: number): void => {
    const max = span();
    const held = (aim <= 0 && delta < 0) || (aim >= max && delta > 0) ? delta * RESIST : delta;
    aim += held;
    const gap = lastAt ? Math.max(1, at - lastAt) : 16;
    vel = lastAt ? vel * 0.6 + (held / gap) * 0.4 : held / gap;
    lastAt = at;
    snapped = false;
    seeking = -1;
  };

  const onWheel = (event: WheelEvent): void => {
    if (count < 2) return;
    const delta = wheelPx(event, stage.clientHeight);
    const max = span();
    // Nothing left in that direction: the page gets its scroll back. Decided on
    // where the strip is heading, not on where it has got to.
    if ((delta > 0 && aim >= max - 0.5) || (delta < 0 && aim <= 0.5)) return;
    event.preventDefault();
    push(delta, performance.now());
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (count < 2 || dragging) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(HANDS_OFF)) return;
    dragging = event.pointerId + 1;
    snapped = false;
    seeking = -1;
    vel = 0;
    lastAt = performance.now();
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.dataset['scrolling'] = '';
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (dragging !== event.pointerId + 1) return;
    const delta = lastY - event.clientY; // dragging up scrolls down the strip
    lastY = event.clientY;
    const max = span();
    if ((aim <= 0 && delta < 0) || (aim >= max && delta > 0)) {
      // The strip has run out. Offer the rest to the page, and only rubber-band
      // if the page cannot take it either.
      const before = window.scrollY;
      window.scrollBy(0, delta);
      if (window.scrollY !== before) return;
    }
    push(delta, performance.now());
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (dragging !== event.pointerId + 1) return;
    dragging = 0;
    stage.releasePointerCapture?.(event.pointerId);
    delete stage.dataset['scrolling'];
    lastAt = 0; // settle on the next frame, carrying the throw
  };

  stage.addEventListener('wheel', onWheel, { passive: false });
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove, { passive: true });
  stage.addEventListener('pointerup', onPointerUp, { passive: true });
  stage.addEventListener('pointercancel', onPointerUp, { passive: true });

  return {
    setCount(next: number): void {
      count = Math.max(0, next);
      if (index > count - 1) index = Math.max(0, count - 1);
      aim = Math.min(aim, span());
      pos = Math.min(pos, span());
      snapped = true;
      painted = Number.NaN;
    },
    scrollTo(next: number): void {
      const at = Math.max(0, Math.min(count - 1, next));
      height = stage.clientHeight || height;
      seeking = at;
      aim = at * height;
      snapped = true;
      vel = 0;
      index = at;
    },
    step(now: number, dt: number): boolean {
      if (count < 2) return false;
      const box = stage.clientHeight || height;
      if (box !== height && box > 0) {
        // The stage resized: stay on the panel the reader is on rather than at
        // the pixel offset, which now means a different place in the strip.
        height = box;
        if (!dragging) {
          aim = index * height;
          pos = aim;
          snapped = true;
        }
      }
      const max = span();

      if (!dragging && !snapped && now - lastAt > IDLE) {
        // The gesture is over: land on the panel the throw was heading for.
        aim = Math.max(0, Math.min(max, Math.round((aim + vel * PROJECT) / height) * height));
        snapped = true;
        vel = 0;
      }

      // A finger carries the strip one to one, because anything else reads as
      // lag against the thing it is touching. Every other source is eased.
      if (dragging) {
        pos = aim;
      } else if (pos !== aim) {
        pos += (aim - pos) * (1 - Math.exp(-dt / EASE));
        if (Math.abs(aim - pos) < 0.1) {
          pos = aim;
          seeking = -1;
        }
      }

      const shown = Math.round(pos * 10) / 10;
      if (shown === painted) return false;
      painted = shown;
      stage.style.setProperty('--lq-scroll', `${-shown}px`);

      const at = height ? Math.max(0, Math.min(count - 1, Math.round(pos / height))) : 0;
      if (at !== index && seeking < 0) {
        index = at;
        onIndex(at);
      }
      return true;
    },
    dispose(): void {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.style.removeProperty('--lq-scroll');
      delete stage.dataset['scrolling'];
    },
  };
}
