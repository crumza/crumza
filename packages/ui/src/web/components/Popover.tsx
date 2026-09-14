import {
  type ComponentProps,
  cloneElement,
  createContext,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';
import type { Align, Side } from '../../core/position';
import { type AppearanceProps, appearanceStyle } from '../appearance';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { composeRefs } from '../primitives/compose-refs';
import { mergeProps, refOf } from '../primitives/merge-props';
import { useAnchorPosition } from '../primitives/use-anchor-position';

interface PopoverContext {
  readonly id: string;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly triggerRef: RefObject<HTMLElement | null>;
}
const Ctx = createContext<PopoverContext | null>(null);

function usePopover(part: string): PopoverContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <Popover>`);
  return ctx;
}

export interface PopoverProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly children: ReactNode;
}

/** A non-modal panel anchored to its trigger. The engine's popover API does the light dismiss, Escape and top layer. */
export function Popover({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: PopoverProps): ReactElement {
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return <Ctx.Provider value={{ id, open: isOpen, setOpen, triggerRef }}>{children}</Ctx.Provider>;
}

export interface PopoverTriggerProps extends ComponentProps<'button'> {
  /** Render this element instead of a plain button, e.g. `render={<Button />}`. */
  readonly render?: ReactElement | undefined;
}

export function PopoverTrigger({
  render,
  ref: forwardedRef,
  ...props
}: PopoverTriggerProps): ReactElement {
  const { id, open, triggerRef } = usePopover('PopoverTrigger');
  const own = {
    popoverTarget: id,
    'aria-expanded': open,
    'aria-haspopup': 'dialog' as const,
    'aria-controls': id,
    'data-state': open ? 'open' : 'closed',
    'data-slot': 'popover-trigger',
  };
  if (render) {
    const merged = mergeProps(render.props as Record<string, unknown>, own, props);
    merged['ref'] = composeRefs(refOf<HTMLElement>(render.props), triggerRef, forwardedRef);
    return cloneElement(render, merged);
  }
  return (
    <button type="button" ref={composeRefs(triggerRef, forwardedRef)} {...mergeProps(own, props)} />
  );
}

export interface PopoverContentProps extends ComponentProps<'div'>, AppearanceProps {
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly offset?: number | undefined;
}

export function PopoverContent({
  className,
  side = 'bottom',
  align = 'center',
  offset = 6,
  children,
  material,
  intensity,
  radius,
  style,
  onToggle,
  ref: forwardedRef,
  ...props
}: PopoverContentProps): ReactElement {
  const { id, open, setOpen, triggerRef } = usePopover('PopoverContent');
  const ref = useRef<HTMLDivElement | null>(null);
  useAnchorPosition({ open, anchor: triggerRef, floating: ref, side, align, offset });

  // Controlled state drives the engine; the toggle event drives the state. Neither loops.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const shown = el.matches(':popover-open');
    if (open && !shown) el.showPopover();
    else if (!open && shown) el.hidePopover();
  }, [open]);

  return (
    <div
      ref={composeRefs(ref, forwardedRef)}
      id={id}
      popover="auto"
      role="dialog"
      data-slot="popover-content"
      onToggle={(e) => {
        onToggle?.(e);
        setOpen(e.newState === 'open');
      }}
      data-material={material}
      style={{ ...appearanceStyle({ intensity, radius }), ...style }}
      className={cn('popover-content glass', className)}
      {...props}
    >
      {children}
    </div>
  );
}
