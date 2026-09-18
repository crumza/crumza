import type { LiquixShapeEntry } from './stage';

/**
 * The motion every liquix control shares: a spring that carries a piece of
 * glass to where it should be, a lift while the pointer holds it, and a
 * cross-over between two looks, clear glass while it moves and a frosted
 * settle once it parks. One implementation, so a switch knob, a slider thumb,
 * a menu highlight and a tab capsule all move the same way.
 *
 * Everything here is plain arithmetic on a fixed timestep. A component owns
 * one instance, feeds it the pointer and the target, calls `step` once per
 * frame, and hands the frame to `shapeFrame` to write into its glass entry.
 */
export interface LiquixMotionTiming {
  /** Spring stiffness. */
  readonly stiffness: number;
  /** Damping ratio: below 1 leans past the target and settles, 1 arrives flat. */
  readonly damping: number;
  /** Within this many px of the target the glass counts as parked. */
  readonly settled: number;
  /** Below this speed, in px per second, the glass counts as parked. */
  readonly moving: number;
  /** Seconds for the shape to arrive as frosted glass when it starts moving. */
  readonly glassIn: number;
  /** Seconds for the rim and refraction to follow, once the glass is mostly there. */
  readonly clarityIn: number;
  readonly clarityAfter: number;
  /** Seconds for the lens quality to go on landing. */
  readonly clarityOut: number;
  /** Seconds for the frosted glass to give way to the resting look, once frosted enough. */
  readonly glassOut: number;
  readonly glassOutAfter: number;
  /** Seconds for the lift to arrive while held, and to leave on release. */
  readonly liftIn: number;
  readonly liftOut: number;
  /** The fastest fling the spring is handed on release, in px per second. */
  readonly fling: number;
}

/** Timed to a reference recording of a glass control being dragged and released. */
export const LIQUIX_TIMING: LiquixMotionTiming = {
  stiffness: 260,
  damping: 0.68,
  settled: 1.5,
  moving: 30,
  glassIn: 0.1,
  clarityIn: 0.08,
  clarityAfter: 0.4,
  clarityOut: 0.04,
  glassOut: 0.07,
  glassOutAfter: 0.45,
  liftIn: 0.1,
  liftOut: 0.05,
  fling: 600,
};

const SUBSTEP = 1 / 120;

/** Smoothstep: an ease at both ends of a 0 to 1 walk. */
export function ease(t: number): number {
  return t * t * (3 - 2 * t);
}

/** One frame of motion, in CSS px and px per second. */
export interface LiquixMotionFrame {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /** 0 at rest, 1 fully lifted, eased. */
  readonly lifted: number;
  /** 0 the resting look, 1 glass, eased. */
  readonly glass: number;
  /** 0 frosted, 1 a clear lens, eased. */
  readonly lens: number;
  /** True while travelling or held. */
  readonly moving: boolean;
  readonly held: boolean;
  readonly elapsed: number;
}

export class LiquixMotion {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  tx = 0;
  ty = 0;
  held = false;
  /** True for glass that never settles to another look: a pane, a button, a field. */
  readonly restGlass: boolean;
  readonly timing: LiquixMotionTiming;
  private heldX = 0;
  private heldY = 0;
  private lift = 0;
  private glass: number;
  private clarity: number;
  private accumulator = 0;
  private last = 0;

  constructor(
    options: { readonly restGlass?: boolean; readonly timing?: Partial<LiquixMotionTiming> } = {},
  ) {
    this.restGlass = options.restGlass ?? false;
    this.timing = { ...LIQUIX_TIMING, ...options.timing };
    this.glass = this.restGlass ? 1 : 0;
    this.clarity = this.restGlass ? 1 : 0;
  }

  /** Goes straight there, no travel: the first placement, or a resize. */
  jump(x: number, y = 0): void {
    this.x = this.tx = x;
    this.y = this.ty = y;
    this.vx = this.vy = 0;
  }

  /**
   * Sets where the spring carries the glass. The clock is reset so the render
   * that changed the target is not integrated as travel time.
   */
  target(x: number, y = 0): void {
    this.tx = x;
    this.ty = y;
    this.last = 0;
    this.accumulator = 0;
  }

  /** The pointer owns the position while held; call on every pointer move. */
  hold(x: number, y = 0): void {
    this.held = true;
    this.heldX = x;
    this.heldY = y;
  }

  /** Hands the spring back the position and the speed the pointer left it with. */
  release(): void {
    this.held = false;
  }

  /** Whether any glass is drawn this frame; a resting control may draw none. */
  get visible(): boolean {
    return this.glass > 0;
  }

  step(time: number): LiquixMotionFrame {
    const t = this.timing;
    const elapsed = this.last ? (time - this.last) / 1000 : 1 / 60;
    this.last = time;

    if (this.held) {
      // The velocity the pointer implies is kept, so the stretch reads it and
      // the spring is handed the fling on release.
      const dt = Math.max(elapsed, SUBSTEP);
      const ix = (this.heldX - this.x) / dt;
      const iy = (this.heldY - this.y) / dt;
      this.vx = clamp(this.vx + (ix - this.vx) * 0.5, -t.fling, t.fling);
      this.vy = clamp(this.vy + (iy - this.vy) * 0.5, -t.fling, t.fling);
      this.x = this.heldX;
      this.y = this.heldY;
      this.accumulator = 0;
    } else {
      // Fixed substeps: a variable step would quietly run the spring in slow
      // motion on a slow frame, and the cap bounds the catch-up after a stall.
      const damping = 2 * Math.sqrt(t.stiffness) * t.damping;
      this.accumulator = Math.min(0.05, this.accumulator + elapsed);
      while (this.accumulator >= SUBSTEP) {
        this.accumulator -= SUBSTEP;
        this.vx += (-t.stiffness * (this.x - this.tx) - damping * this.vx) * SUBSTEP;
        this.vy += (-t.stiffness * (this.y - this.ty) - damping * this.vy) * SUBSTEP;
        this.x += this.vx * SUBSTEP;
        this.y += this.vy * SUBSTEP;
      }
      if (Math.abs(this.x - this.tx) < 0.05 && Math.abs(this.vx) < 1) {
        this.x = this.tx;
        this.vx = 0;
      }
      if (Math.abs(this.y - this.ty) < 0.05 && Math.abs(this.vy) < 1) {
        this.y = this.ty;
        this.vy = 0;
      }
    }

    this.lift = this.held
      ? Math.min(1, this.lift + elapsed / t.liftIn)
      : Math.max(0, this.lift - elapsed / t.liftOut);

    // Parked means near the target and nearly still, both at once: a spring
    // passes through its target at speed and stands still for an instant at
    // the top of each overshoot, and either test alone would let go of the
    // glass mid-bounce and grab it again on the way back.
    const distance = Math.hypot(this.x - this.tx, this.y - this.ty);
    const speed = Math.hypot(this.vx, this.vy);
    const moving = this.held || distance > t.settled || speed > t.moving;

    // Two values walk towards where they should be, each gated on the other,
    // so the order of events holds whichever way it is going: glass arrives
    // frosted and clears; on landing it frosts first and then gives way.
    if (this.restGlass) {
      this.glass = 1;
      this.clarity = 1;
    } else if (moving) {
      this.glass = Math.min(1, this.glass + elapsed / t.glassIn);
      if (this.glass > t.clarityAfter)
        this.clarity = Math.min(1, this.clarity + elapsed / t.clarityIn);
    } else {
      this.clarity = Math.max(0, this.clarity - elapsed / t.clarityOut);
      if (this.clarity < t.glassOutAfter)
        this.glass = Math.max(0, this.glass - elapsed / t.glassOut);
    }

    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      lifted: ease(this.lift),
      glass: ease(this.glass),
      lens: ease(this.clarity),
      moving,
      held: this.held,
      elapsed,
    };
  }
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

/** How a piece of glass grows, stretches and lights up as it moves. */
export interface LiquixLensStyle {
  /** CSS px the shape grows while lifted, each axis. */
  readonly liftWidth: number;
  readonly liftHeight: number;
  /** Drop shadow while lifted, in the units of the surface's shadowFactor. */
  readonly liftShadow: number;
  /** Lens rim depth as a share of the shape's height. */
  readonly lens: number;
  /** Growth along the direction of travel at full speed, and pinch across it. */
  readonly stretch: number;
  readonly pinch: number;
  /** Speed, in px per second, that counts as full. */
  readonly fullSpeed: number;
}

export const LIQUIX_LENS: LiquixLensStyle = {
  liftWidth: 12,
  liftHeight: 20,
  liftShadow: 35,
  lens: 0.3,
  stretch: 0.2,
  pinch: 0.12,
  fullSpeed: 900,
};

/** The shape a frame gives a piece of glass of a given resting size. */
export interface LiquixShapeFrame {
  readonly width: number;
  readonly height: number;
}

/**
 * Writes one frame of motion into a glass entry: the stretched, lifted shape,
 * how much of it is glass and how clear, its shadow, rim and glow. Returns
 * the shape it settled on, for the element that has to match it.
 */
export function shapeFrame(
  entry: LiquixShapeEntry,
  frame: LiquixMotionFrame,
  rest: LiquixShapeFrame,
  style: LiquixLensStyle = LIQUIX_LENS,
): LiquixShapeFrame {
  const sx = Math.min(1, Math.abs(frame.vx) / style.fullSpeed);
  const sy = Math.min(1, Math.abs(frame.vy) / style.fullSpeed);
  const width =
    rest.width * (1 + style.stretch * sx - style.pinch * sy) + style.liftWidth * frame.lifted;
  const height =
    rest.height * (1 + style.stretch * sy - style.pinch * sx) + style.liftHeight * frame.lifted;
  const shape = entry.shape as {
    width: number;
    height: number;
    cornerRadius: number;
    roundness: number;
  };
  shape.width = width;
  shape.height = height;
  shape.cornerRadius = Math.min(width, height) / 2;
  entry.alpha = frame.glass;
  entry.clarity = frame.lens;
  entry.shadow = style.liftShadow * frame.lifted;
  entry.bevel = height * style.lens;
  entry.glowTarget = Math.max(0.5 * Math.max(sx, sy), 0.35 * frame.lifted) * frame.lens;
  return { width, height };
}
