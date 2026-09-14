import { Button, Lens, Scene, Switch } from '@crumza/ui/web';
import {
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';

const BACKDROP = [
  'radial-gradient(circle at 18% 22%, oklch(0.78 0.19 35) 0, transparent 34%)',
  'radial-gradient(circle at 82% 30%, oklch(0.72 0.19 300) 0, transparent 36%)',
  'radial-gradient(circle at 50% 95%, oklch(0.82 0.16 160) 0, transparent 40%)',
  'repeating-linear-gradient(0deg, light-dark(oklch(0.2 0 0 / 0.22), oklch(0.95 0 0 / 0.14)) 0 1.5px, transparent 1.5px 40px)',
  'repeating-linear-gradient(90deg, light-dark(oklch(0.99 0 0 / 0.6), oklch(0.99 0 0 / 0.16)) 0 1.5px, transparent 1.5px 48px)',
  'linear-gradient(light-dark(oklch(0.96 0.02 80), oklch(0.28 0.03 60)), light-dark(oklch(0.9 0.03 250), oklch(0.24 0.04 260)))',
].join(', ');

/** Drag the pane, or let the backdrop drift: the edge bends what passes under it. */
export function LensDemo(): ReactElement {
  const [drift, setDrift] = useState(false);
  const [pos, setPos] = useState({ x: 40, y: 48 });
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!drift) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number): void => {
      const t = (now - start) / 1000;
      sceneRef.current?.style.setProperty('--pan-x', `${Math.round(t * 22)}px`);
      sceneRef.current?.style.setProperty('--pan-y', `${Math.round(Math.sin(t / 3) * 20)}px`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [drift]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return;
    setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
  };
  const onUp = (): void => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
          lens: real refraction, every engine
        </span>
        <Switch label="drifting backdrop" checked={drift} onCheckedChange={setDrift} />
      </div>
      <Scene
        ref={sceneRef}
        backdrop={BACKDROP}
        className="h-80 overflow-clip rounded-surface border border-(--border)"
      >
        <Button material="liquid" data-testid="optical-button" className="absolute bottom-6 left-6">
          Optical button
        </Button>
        <Lens
          live={drift || dragging}
          interactive
          className="absolute w-72 rounded-2xl p-4"
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="grid gap-2">
            <span className="text-ui font-control">Drag me</span>
            <span className="text-ui-sm text-muted-foreground">
              The band along the edge bends the backdrop; the centre stays true.
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="primary">
                Share
              </Button>
              <Button size="sm" variant="secondary">
                Later
              </Button>
            </div>
          </div>
        </Lens>
        <Lens
          live={drift}
          className="absolute right-6 bottom-6 h-9 w-9 rounded-full"
          aria-hidden="true"
        />
        <Lens
          live={drift}
          className="absolute right-20 bottom-6 h-9 rounded-full px-4"
          aria-hidden="true"
        >
          <span className="flex h-full items-center text-ui font-control">Pill</span>
        </Lens>
      </Scene>
    </div>
  );
}
