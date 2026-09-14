import {
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
  cloneElement,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { type AppearanceProps, appearanceStyle } from '../appearance';
import { cn } from '../cn';
import { composeRefs } from '../primitives/compose-refs';
import { mergeProps, refOf } from '../primitives/merge-props';

interface DialogContext {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly titleId: string;
  readonly descriptionId: string;
}
const Ctx = createContext<DialogContext | null>(null);

function useDialog(part: string): DialogContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <Dialog>`);
  return ctx;
}

export interface DialogProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly children: ReactNode;
}

/** A modal on the native `<dialog>`: the engine traps focus, inerts the page, handles Escape and returns focus. */
export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: DialogProps): ReactElement {
  const titleId = useId();
  const descriptionId = useId();
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <Ctx.Provider value={{ open: isOpen, setOpen, titleId, descriptionId }}>
      {children}
    </Ctx.Provider>
  );
}

export interface DialogTriggerProps extends ComponentProps<'button'> {
  readonly render?: ReactElement | undefined;
}

export function DialogTrigger({
  render,
  onClick,
  ref: forwardedRef,
  ...props
}: DialogTriggerProps): ReactElement {
  const { open, setOpen } = useDialog('DialogTrigger');
  const own = {
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'data-state': open ? 'open' : 'closed',
    'data-slot': 'dialog-trigger',
    onClick: () => setOpen(true),
  };
  if (render) {
    const merged = mergeProps(render.props as Record<string, unknown>, own, { onClick, ...props });
    merged['ref'] = composeRefs(refOf<HTMLElement>(render.props), forwardedRef);
    return cloneElement(render, merged);
  }
  return <button type="button" ref={forwardedRef} {...mergeProps(own, { onClick, ...props })} />;
}

export interface DialogCloseProps extends ComponentProps<'button'> {
  readonly render?: ReactElement | undefined;
}

export function DialogClose({
  render,
  onClick,
  ref: forwardedRef,
  ...props
}: DialogCloseProps): ReactElement {
  const { setOpen } = useDialog('DialogClose');
  const own = { 'data-slot': 'dialog-close', onClick: () => setOpen(false) };
  if (render) {
    const merged = mergeProps(render.props as Record<string, unknown>, own, { onClick, ...props });
    merged['ref'] = composeRefs(refOf<HTMLElement>(render.props), forwardedRef);
    return cloneElement(render, merged);
  }
  return <button type="button" ref={forwardedRef} {...mergeProps(own, { onClick, ...props })} />;
}

export interface DialogContentProps extends ComponentProps<'dialog'>, AppearanceProps {
  /** Clicking the backdrop closes the dialog. Turn off for confirmations that must be answered. */
  readonly dismissable?: boolean | undefined;
}

export function DialogContent({
  className,
  dismissable = true,
  children,
  ref: forwardedRef,
  material,
  intensity,
  radius,
  style,
  onCancel,
  onClose,
  onPointerDown,
  onPointerUp,
  ...props
}: DialogContentProps): ReactElement {
  const { open, setOpen, titleId, descriptionId } = useDialog('DialogContent');
  const ref = useRef<HTMLDialogElement | null>(null);
  const pressedBackdrop = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const onBackdrop = (e: ReactPointerEvent<HTMLDialogElement>): boolean => {
    const el = ref.current;
    if (!el || e.target !== el) return false;
    const r = el.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  return (
    <dialog
      ref={composeRefs(ref, forwardedRef)}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-slot="dialog-content"
      onCancel={(e) => {
        onCancel?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        setOpen(false);
      }}
      onClose={(e) => {
        onClose?.(e);
        setOpen(false);
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (e.defaultPrevented) return;
        pressedBackdrop.current = dismissable && onBackdrop(e);
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        if (!e.defaultPrevented && pressedBackdrop.current && onBackdrop(e)) setOpen(false);
        pressedBackdrop.current = false;
      }}
      data-material={material}
      style={{ ...appearanceStyle({ intensity, radius }), ...style }}
      className={cn('dialog-content glass', className)}
      {...props}
    >
      {children}
    </dialog>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<'h2'>): ReactElement {
  const { titleId } = useDialog('DialogTitle');
  return (
    <h2
      id={titleId}
      data-slot="dialog-title"
      className={cn('text-lg tracking-[-0.01em]', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: ComponentProps<'p'>): ReactElement {
  const { descriptionId } = useDialog('DialogDescription');
  return (
    <p
      id={descriptionId}
      data-slot="dialog-description"
      className={cn('text-ui text-muted-foreground', className)}
      {...props}
    />
  );
}
