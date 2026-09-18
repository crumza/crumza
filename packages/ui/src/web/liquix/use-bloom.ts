import { useEffect, useRef, useState } from 'react';
import { LiquixMotion } from './motion';

/**
 * Opening and closing on a spring, for panels: a menu, a popover, a toast.
 * `open` is where it should be; the hook walks a 0 to 1 progress there on
 * the shared spring, calls `onFrame` with it every frame, and reports whether
 * the panel should be in the DOM at all, which is from the moment it starts
 * opening until it has fully closed.
 */
export function useBloom(open: boolean, onFrame: (progress: number) => void): boolean {
  const [mounted, setMounted] = useState(open);
  const motion = useRef(
    new LiquixMotion({
      restGlass: true,
      timing: { stiffness: 420, damping: 0.86, settled: 0.5, moving: 5 },
    }),
  );
  const frameRef = useRef(onFrame);
  frameRef.current = onFrame;

  useEffect(() => {
    const m = motion.current;
    if (open) {
      setMounted(true);
      m.target(100);
    } else m.target(0);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const m = motion.current;
    let raf = 0;
    const loop = (time: number) => {
      const frame = m.step(time);
      const progress = Math.max(0, Math.min(1, frame.x / 100));
      frameRef.current(progress);
      if (!open && !frame.moving && frame.x < 0.5) {
        setMounted(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mounted, open]);

  return mounted;
}
