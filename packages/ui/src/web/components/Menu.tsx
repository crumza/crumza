import {
  type ComponentProps,
  cloneElement,
  createContext,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';
import type { Align, Side } from '../../core/position';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';
import { composeRefs } from '../primitives/compose-refs';
import { mergeProps, refOf } from '../primitives/merge-props';
import { useAnchorPosition } from '../primitives/use-anchor-position';

interface MenuContext {
  readonly id: string;
  readonly triggerId: string;
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly triggerRef: RefObject<HTMLElement | null>;
  /** Where focus goes when the menu opens: `first`/`last` after keyboard, `none` after pointer. */
  readonly focusOnOpen: RefObject<'first' | 'last' | 'none'>;
}
const Ctx = createContext<MenuContext | null>(null);

function useMenu(part: string): MenuContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <Menu>`);
  return ctx;
}

export interface MenuProps {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly children: ReactNode;
}

/** A list of commands. Popover underneath, so the engine owns dismiss, Escape and the top layer. */
export function Menu({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}: MenuProps): ReactElement {
  const id = useId();
  const triggerId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const focusOnOpen = useRef<'first' | 'last' | 'none'>('none');
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <Ctx.Provider value={{ id, triggerId, open: isOpen, setOpen, triggerRef, focusOnOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export interface MenuTriggerProps extends ComponentProps<'button'> {
  readonly render?: ReactElement | undefined;
}

export function MenuTrigger({
  render,
  ref: forwardedRef,
  ...props
}: MenuTriggerProps): ReactElement {
  const { id, triggerId, open, setOpen, triggerRef, focusOnOpen } = useMenu('MenuTrigger');
  const own = {
    id: triggerId,
    popoverTarget: id,
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
    'aria-controls': id,
    'data-state': open ? 'open' : 'closed',
    'data-slot': 'menu-trigger',
    onPointerDown: () => {
      focusOnOpen.current = 'none';
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusOnOpen.current = e.key === 'ArrowDown' ? 'first' : 'last';
        setOpen(true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        focusOnOpen.current = 'first';
      }
    },
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

const ITEMS = '[role^="menuitem"]:not([aria-disabled="true"])';

export interface MenuContentProps extends ComponentProps<'div'> {
  readonly side?: Side | undefined;
  readonly align?: Align | undefined;
  readonly offset?: number | undefined;
}

export function MenuContent({
  className,
  side = 'bottom',
  align = 'start',
  offset = 4,
  onKeyDown,
  onToggle: onToggleProp,
  ref: forwardedRef,
  children,
  ...props
}: MenuContentProps): ReactElement {
  const { id, triggerId, open, setOpen, triggerRef, focusOnOpen } = useMenu('MenuContent');
  const ref = useRef<HTMLDivElement | null>(null);
  const typed = useRef({ buffer: '', at: 0 });
  useAnchorPosition({ open, anchor: triggerRef, floating: ref, side, align, offset });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const shown = el.matches(':popover-open');
    if (open && !shown) el.showPopover();
    else if (!open && shown) el.hidePopover();
  }, [open]);

  const onToggle = (e: {
    readonly newState: string;
    readonly currentTarget: HTMLDivElement;
  }): void => {
    const isOpen = e.newState === 'open';
    setOpen(isOpen);
    if (!isOpen) return;
    const el = e.currentTarget;
    const items = Array.from(el.querySelectorAll<HTMLElement>(ITEMS));
    const target =
      focusOnOpen.current === 'first'
        ? items[0]
        : focusOnOpen.current === 'last'
          ? items[items.length - 1]
          : el;
    target?.focus({ preventScroll: true });
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.nativeEvent.isComposing) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    if (items.length === 0) return;
    const at = items.indexOf(document.activeElement as HTMLElement);
    const focus = (i: number): void => {
      e.preventDefault();
      items[i]?.focus();
    };
    switch (e.key) {
      case 'ArrowDown':
        focus((at + 1) % items.length);
        return;
      case 'ArrowUp':
        focus((at - 1 + items.length) % items.length);
        return;
      case 'Home':
      case 'PageUp':
        focus(0);
        return;
      case 'End':
      case 'PageDown':
        focus(items.length - 1);
        return;
      case 'Tab':
        setOpen(false);
        return;
      default:
        break;
    }
    // Typeahead: printable characters build a 600ms buffer and jump to the next match.
    if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) return;
    const now = Date.now();
    const t = typed.current;
    t.buffer = now - t.at > 600 ? e.key : t.buffer + e.key;
    t.at = now;
    const q = (new Set(t.buffer.toLowerCase()).size === 1 ? e.key : t.buffer).toLowerCase();
    const order = [...items.slice(at + 1), ...items.slice(0, at + 1)];
    const hit = order.find((i) => (i.textContent ?? '').trim().toLowerCase().startsWith(q));
    if (hit) {
      e.preventDefault();
      hit.focus();
    }
  };

  return (
    <div
      ref={composeRefs(ref, forwardedRef)}
      id={id}
      role="menu"
      aria-labelledby={triggerId}
      popover="auto"
      tabIndex={-1}
      data-slot="menu-content"
      onToggle={(event) => {
        onToggleProp?.(event);
        onToggle(event);
      }}
      onKeyDown={handleKey}
      className={cn('menu-content glass', className)}
      {...props}
    >
      {children}
    </div>
  );
}

const itemClass = [
  'relative flex h-(--control-md) w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 pl-7 text-left text-ui leading-none',
  'text-foreground outline-none transition-colors duration-(--duration-fast)',
  'focus:bg-foreground/8 aria-disabled:pointer-events-none aria-disabled:opacity-45',
].join(' ');

export interface MenuItemProps extends Omit<ComponentProps<'button'>, 'onSelect'> {
  /** Called on click, Enter or Space. Call `event.preventDefault()` to keep the menu open. */
  readonly onSelect?: ((event: Event) => void) | undefined;
  readonly disabled?: boolean | undefined;
  /** Right-aligned hint, e.g. `⌘S`. Purely visual; bind the shortcut yourself. */
  readonly shortcut?: ReactNode;
}

function useSelect(onSelect: MenuItemProps['onSelect']): (e: React.MouseEvent) => void {
  const { setOpen } = useMenu('MenuItem');
  return (e) => {
    onSelect?.(e.nativeEvent);
    if (!e.nativeEvent.defaultPrevented) setOpen(false);
  };
}

export function MenuItem({
  className,
  onSelect,
  disabled = false,
  shortcut,
  children,
  onClick,
  ...props
}: MenuItemProps): ReactElement {
  const select = useSelect(onSelect);
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={disabled}
      tabIndex={-1}
      data-slot="menu-item"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch' && !disabled) e.currentTarget.focus();
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!disabled) select(e);
      }}
      className={cn(itemClass, className)}
      {...props}
    >
      {children}
      {shortcut ? (
        <span className="ml-auto pl-4 font-mono text-ui-sm text-muted-foreground">{shortcut}</span>
      ) : null}
    </button>
  );
}

function Check(): ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="absolute left-2 size-3.5"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 5" />
    </svg>
  );
}

export interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'onSelect'> {
  readonly checked?: boolean | undefined;
  readonly defaultChecked?: boolean | undefined;
  readonly onCheckedChange?: ((checked: boolean) => void) | undefined;
}

export function MenuCheckboxItem({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  shortcut,
  children,
  onClick,
  ...props
}: MenuCheckboxItemProps): ReactElement {
  const [on, set] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });
  const select = useSelect((e) => {
    e.preventDefault();
    set(!on);
  });
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={on}
      aria-disabled={disabled}
      tabIndex={-1}
      data-slot="menu-checkbox-item"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch' && !disabled) e.currentTarget.focus();
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!disabled) select(e);
      }}
      className={cn(itemClass, className)}
      {...props}
    >
      {on ? <Check /> : null}
      {children}
      {shortcut ? (
        <span className="ml-auto pl-4 font-mono text-ui-sm text-muted-foreground">{shortcut}</span>
      ) : null}
    </button>
  );
}

interface RadioContext {
  readonly value: string;
  readonly set: (value: string) => void;
}
const RadioCtx = createContext<RadioContext | null>(null);

export interface MenuRadioGroupProps {
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly children: ReactNode;
}

export function MenuRadioGroup({
  value,
  defaultValue = '',
  onValueChange,
  children,
}: MenuRadioGroupProps): ReactElement {
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange });
  return (
    <RadioCtx.Provider value={{ value: current, set }}>
      <div data-slot="menu-radio-group">{children}</div>
    </RadioCtx.Provider>
  );
}

export interface MenuRadioItemProps extends Omit<MenuItemProps, 'onSelect' | 'value'> {
  readonly value: string;
}

export function MenuRadioItem({
  className,
  value,
  disabled = false,
  shortcut,
  children,
  onClick,
  ...props
}: MenuRadioItemProps): ReactElement {
  const ctx = useContext(RadioCtx);
  if (!ctx) throw new Error('<MenuRadioItem> must be inside <MenuRadioGroup>');
  const on = ctx.value === value;
  const select = useSelect((e) => {
    e.preventDefault();
    ctx.set(value);
  });
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={on}
      aria-disabled={disabled}
      tabIndex={-1}
      data-slot="menu-radio-item"
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch' && !disabled) e.currentTarget.focus();
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!disabled) select(e);
      }}
      className={cn(itemClass, className)}
      {...props}
    >
      {on ? <span className="absolute left-3 size-1.5 rounded-full bg-current" /> : null}
      {children}
      {shortcut ? (
        <span className="ml-auto pl-4 font-mono text-ui-sm text-muted-foreground">{shortcut}</span>
      ) : null}
    </button>
  );
}

export function MenuLabel({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      data-slot="menu-label"
      className={cn(
        'px-2 pt-1.5 pb-1 pl-7 font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function MenuSeparator({
  className,
}: {
  readonly className?: string | undefined;
}): ReactElement {
  return (
    <hr
      data-slot="menu-separator"
      className={cn('my-1 h-(--hairline) border-0 bg-(--border)', className)}
    />
  );
}
