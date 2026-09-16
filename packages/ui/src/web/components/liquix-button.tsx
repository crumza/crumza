import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../cn';
import { type LiquixShape, useLiquixShape } from '../liquix/stage';

export interface LiquixButtonBaseProps extends Omit<ComponentProps<'button'>, 'style'> {
  readonly shape: LiquixShape;
  readonly slot: string;
}

/**
 * The DOM half of a shader-drawn shape.
 *
 * The element is a real button: it carries the label, the focus ring, keyboard
 * activation and the click target, and it is transparent. Its box is what the
 * shader uses for the shape's position, so the glass follows the layout
 * wherever the button ends up.
 *
 * Must be rendered inside a LiquixStage; without one it falls back to a CSS
 * approximation with no refraction, dispersion, glare or stretching.
 */
export function LiquixButtonBase({
  shape,
  slot,
  className,
  children,
  type = 'button',
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onFocus,
  onBlur,
  ...props
}: LiquixButtonBaseProps): ReactElement {
  const { buttonRef, labelRef, setInteraction, fallback } = useLiquixShape(shape);

  return (
    <button
      {...props}
      ref={buttonRef}
      type={type}
      data-slot={slot}
      data-fallback={fallback ? '' : undefined}
      className={cn('liquix-button', className)}
      style={{
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        borderRadius: `${shape.cornerRadius}px`,
      }}
      onPointerEnter={(event) => {
        setInteraction('hover');
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setInteraction('idle');
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        setInteraction('press');
        onPointerDown?.(event);
      }}
      onPointerUp={(event) => {
        setInteraction('hover');
        onPointerUp?.(event);
      }}
      onPointerCancel={(event) => {
        setInteraction('idle');
        onPointerCancel?.(event);
      }}
      onFocus={(event) => {
        setInteraction('hover');
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setInteraction('idle');
        onBlur?.(event);
      }}
    >
      <span ref={labelRef} className="liquix-button__label">
        {children}
      </span>
    </button>
  );
}
