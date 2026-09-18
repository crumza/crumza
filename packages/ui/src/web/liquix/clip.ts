/**
 * Clip paths for colour that follows a capsule: whatever part of a label sits
 * inside the capsule's outline is drawn in one colour, the rest in another,
 * as two clipped copies. Paint only, no layout, so it can run every frame.
 */

/** A capsule as a stadium in its container's coordinates: centre and size in CSS px. */
export interface Capsule {
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
}

// Points per semicircle of the outline. At 16 the chord error on a 24px
// radius is about a tenth of a pixel.
const ARC = 16;
const LEFT_CAP = Array.from({ length: ARC + 1 }, (_, i) => {
  const a = -Math.PI / 2 - (Math.PI * i) / ARC;
  return [Math.cos(a), Math.sin(a)] as const;
});
const RIGHT_CAP = Array.from({ length: ARC + 1 }, (_, i) => {
  const a = Math.PI / 2 - (Math.PI * i) / ARC;
  return [Math.cos(a), Math.sin(a)] as const;
});

const px = (value: number): string => `${value.toFixed(2)}px`;

/**
 * The outline as polygon points, starting and ending at the top centre and
 * running counter-clockwise on screen: left along the top, down the left cap,
 * along the bottom, up the right cap.
 */
function stadium({ cx, cy, w, h }: Capsule): string {
  const r = Math.min(w, h) / 2;
  const dx = Math.max(0, w / 2 - r);
  const dy = Math.max(0, h / 2 - r);
  const points: string[] = [`${px(cx)} ${px(cy - dy - r)}`];
  for (const [c, s] of LEFT_CAP) {
    points.push(`${px(cx - dx + c * r)} ${px(cy + (s < 0 ? -dy : dy) + s * r)}`);
  }
  for (const [c, s] of RIGHT_CAP) {
    points.push(`${px(cx + dx + c * r)} ${px(cy + (s < 0 ? -dy : dy) + s * r)}`);
  }
  points.push(`${px(cx)} ${px(cy - dy - r)}`);
  return points.join(', ');
}

/** A clip that keeps only what is inside the capsule. */
export function insideClip(capsule: Capsule): string {
  return `polygon(${stadium(capsule)})`;
}

/**
 * A clip that keeps everything in a box except the capsule: the box's outline
 * clockwise, then a bridge straight up from the capsule's top to the box's
 * top edge and the capsule's outline the other way round, so the non-zero
 * rule leaves a hole. The bridge crosses only the gap above the capsule.
 */
export function outsideClip(width: number, height: number, capsule: Capsule): string {
  const top = `${px(capsule.cx)} 0px`;
  return `polygon(${top}, ${px(width)} 0px, ${px(width)} ${px(height)}, 0px ${px(height)}, 0px 0px, ${top}, ${stadium(capsule)})`;
}
