/* Press feedback for every control in a liquid scene.

   Glass that does not answer a finger reads as a picture of a button. So the
   scene installs one delegated listener rather than every component wiring its
   own handlers: a press anywhere inside it marks the control it landed on and
   records WHERE it landed, and core.css does the rest (a scale the component
   tunes, and a light that spreads from the touch point).

   Delegation, not a hook, because the state is per POINTER, not per component:
   one pointer is down at a time, the control it is over changes under it, and a
   press that turns into a scroll has to be taken back. That is one small state
   machine at the root, not ten copies of one in React state. */

/** Everything that answers a press. A component opts an oddity in with [data-lq-press]. */
const CONTROLS = [
  'button',
  'a[href]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="menuitemradio"]',
  '[role="menuitemcheckbox"]',
  '[role="option"]',
  '[role="switch"]',
  '[role="slider"]',
  '[data-lq-press]',
].join(',');

/** Past this much travel the gesture is a scroll or a drag, so the press is off. */
const SLIP = 12;
/** A flick can be shorter than a frame or two; hold the pressed look this long
 *  so a real tap is always visible. */
const MIN_HOLD = 110;
/** Life of the ripple. Kept in step with the lq-tap animation in core.css. */
const TAP = 540;

const disabled = (el: HTMLElement): boolean =>
  (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true';

/**
 * Wire press feedback for everything inside `root`.
 *
 * `onPress` is called whenever the pressed state changes, so the scene can pump
 * a few frames: the control moves, and moving glass has to repaint.
 */
export function attachLiquidPress(root: HTMLElement, onPress?: () => void): () => void {
  let held: HTMLElement | null = null;
  let heldAt = 0;
  let startX = 0;
  let startY = 0;
  let releaseTimer = 0;
  let tapTimer = 0;
  let keyed: HTMLElement | null = null;

  const control = (target: EventTarget | null): HTMLElement | null => {
    if (!(target instanceof Element)) return null;
    const el = target.closest<HTMLElement>(CONTROLS);
    return el && root.contains(el) && !disabled(el) ? el : null;
  };

  /** Mark the control pressed and pin the ripple to the point it was touched. */
  const press = (el: HTMLElement, clientX: number, clientY: number): void => {
    const box = el.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    // The ripple has to reach the far corner however off-centre the touch was,
    // and the gradient is drawn across its own box, so this is a diameter.
    const reach = 2 * Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));

    // The ripple is an absolutely positioned ::after, so the control has to be
    // its containing block. Read first, write only when it is not one already:
    // a stylesheet cannot know which of them is static.
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

    el.style.setProperty('--lq-tap-x', `${x}px`);
    el.style.setProperty('--lq-tap-y', `${y}px`);
    el.style.setProperty('--lq-tap-reach', `${reach}px`);
    el.dataset['press'] = 'on';

    // Restart the ripple from zero even on a press that lands before the last
    // one has faded: an attribute put straight back is not a new animation.
    delete el.dataset['tap'];
    void el.offsetWidth;
    el.dataset['tap'] = '';
    window.clearTimeout(tapTimer);
    tapTimer = window.setTimeout(() => {
      delete el.dataset['tap'];
    }, TAP);

    held = el;
    heldAt = performance.now();
    startX = clientX;
    startY = clientY;
    onPress?.();
  };

  const lift = (el: HTMLElement): void => {
    delete el.dataset['press'];
    onPress?.();
  };

  /** Let go, but never so fast that the press was never seen. */
  const release = (): void => {
    const el = held;
    if (!el) return;
    held = null;
    const waited = performance.now() - heldAt;
    if (waited >= MIN_HOLD) {
      lift(el);
      return;
    }
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => lift(el), MIN_HOLD - waited);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const el = control(event.target);
    if (!el) return;
    release();
    press(el, event.clientX, event.clientY);
  };

  // Touch pointers are captured to their target, so a finger sliding off a
  // button still reports moves here. Travel past the threshold is the user
  // scrolling or dragging rather than tapping, and takes the press back.
  const onPointerMove = (event: PointerEvent): void => {
    if (!held) return;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > SLIP) release();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (event.repeat || keyed) return;
    const el = control(event.target);
    if (!el) return;
    // No pointer, so the light spreads from the middle of the control.
    const box = el.getBoundingClientRect();
    keyed = el;
    press(el, box.left + box.width / 2, box.top + box.height / 2);
  };

  const onKeyUp = (): void => {
    if (!keyed) return;
    keyed = null;
    release();
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  window.addEventListener('blur', release);

  return () => {
    window.clearTimeout(releaseTimer);
    window.clearTimeout(tapTimer);
    if (held) lift(held);
    held = null;
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    window.removeEventListener('blur', release);
  };
}
