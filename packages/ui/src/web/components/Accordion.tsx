import {
  type ComponentProps,
  createContext,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
} from 'react';
import { useControllableState } from '../../core/use-controllable-state';
import { cn } from '../cn';

const NONE: readonly string[] = [];

interface AccordionContext {
  readonly id: string;
  readonly open: readonly string[];
  readonly toggle: (value: string) => void;
  readonly headingLevel: 2 | 3 | 4 | 5 | 6;
}
const Ctx = createContext<AccordionContext | null>(null);

interface ItemContext {
  readonly value: string;
  readonly open: boolean;
}
const ItemCtx = createContext<ItemContext | null>(null);

function useAccordion(part: string): AccordionContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <Accordion>`);
  return ctx;
}

function useItem(part: string): ItemContext {
  const ctx = useContext(ItemCtx);
  if (!ctx) throw new Error(`<${part}> must be inside <AccordionItem>`);
  return ctx;
}

export interface AccordionProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  /** Values of the open items. Leave undefined for uncontrolled. */
  readonly value?: readonly string[] | undefined;
  readonly defaultValue?: readonly string[] | undefined;
  readonly onValueChange?: ((value: readonly string[]) => void) | undefined;
  /** Allow several items open at once. With this off only the first value is honoured. */
  readonly multiple?: boolean | undefined;
  /** With `multiple` off, whether the open item can be closed again. */
  readonly collapsible?: boolean | undefined;
  /** The level of the heading each trigger sits in. Match the surrounding document. */
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
}

/** Stacked sections a reader opens for detail. For sections of one view use Tabs. */
export function Accordion({
  value,
  defaultValue = NONE,
  onValueChange,
  multiple = false,
  collapsible = true,
  headingLevel = 3,
  className,
  ...props
}: AccordionProps): ReactElement {
  const id = useId();
  const [current, set] = useControllableState<readonly string[]>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  // One item at a time means one item at a time, whatever the value says.
  const open = multiple ? current : current.slice(0, 1);

  const toggle = (item: string): void => {
    if (multiple) {
      set(open.includes(item) ? open.filter((each) => each !== item) : [...open, item]);
      return;
    }
    if (!open.includes(item)) {
      set([item]);
      return;
    }
    if (collapsible) set([]);
  };

  return (
    <Ctx.Provider value={{ id, open, toggle, headingLevel }}>
      <div data-slot="accordion" className={cn('w-full text-ui', className)} {...props} />
    </Ctx.Provider>
  );
}

/** Moves focus between the triggers of the accordion the pressed one belongs to. */
function moveFocus(event: KeyboardEvent<HTMLButtonElement>): void {
  const step =
    event.key === 'ArrowDown'
      ? 1
      : event.key === 'ArrowUp'
        ? -1
        : event.key === 'Home'
          ? -Infinity
          : event.key === 'End'
            ? Infinity
            : 0;
  if (!step) return;
  const root = event.currentTarget.closest('[data-slot="accordion"]');
  if (!root) return;
  const triggers = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-slot="accordion-trigger"]:not(:disabled)'),
    // A nested accordion keeps its own arrows; only this level's triggers are in the cycle.
  ).filter((trigger) => trigger.closest('[data-slot="accordion"]') === root);
  const at = triggers.indexOf(event.currentTarget);
  if (at === -1) return;
  const to =
    step === -Infinity
      ? 0
      : step === Infinity
        ? triggers.length - 1
        : (at + step + triggers.length) % triggers.length;
  const next = triggers[to];
  if (!next) return;
  event.preventDefault();
  next.focus();
}

export interface AccordionItemProps extends Omit<ComponentProps<'div'>, 'value'> {
  readonly value: string;
}

export function AccordionItem({ value, className, ...props }: AccordionItemProps): ReactElement {
  const { open } = useAccordion('AccordionItem');
  const isOpen = open.includes(value);
  return (
    <ItemCtx.Provider value={{ value, open: isOpen }}>
      <div
        data-slot="accordion-item"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('border-(--border) border-b last:border-b-0', className)}
        {...props}
      />
    </ItemCtx.Provider>
  );
}

export interface AccordionTriggerProps extends ComponentProps<'button'> {
  readonly children?: ReactNode;
}

export function AccordionTrigger({
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: AccordionTriggerProps): ReactElement {
  const { id, toggle, headingLevel } = useAccordion('AccordionTrigger');
  const { value, open } = useItem('AccordionTrigger');
  const Heading = `h${headingLevel}` as const;
  return (
    // The heading is what lets a screen reader list the sections and jump between them.
    <Heading className="m-0 text-inherit leading-[inherit] tracking-[inherit]">
      <button
        type="button"
        id={`${id}-trigger-${value}`}
        aria-expanded={open}
        aria-controls={`${id}-panel-${value}`}
        data-slot="accordion-trigger"
        data-value={value}
        data-state={open ? 'open' : 'closed'}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          toggle(value);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          moveFocus(event);
        }}
        className={cn(
          'flex w-full cursor-pointer select-none items-center justify-between gap-3 py-3 text-left',
          'text-foreground transition-colors duration-(--duration-fast) hover:text-muted-foreground',
          'focus-visible:focus-outline outline-none disabled:pointer-events-none disabled:opacity-45',
          className,
        )}
        {...props}
      >
        {children}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)',
            open && 'rotate-180',
          )}
        >
          <path d="M4 6.5 8 10.5 12 6.5" />
        </svg>
      </button>
    </Heading>
  );
}

/** `className` and the rest of the props land on the content, not on the collapsing track. */
export interface AccordionPanelProps extends ComponentProps<'div'> {
  readonly children?: ReactNode;
}

export function AccordionPanel({ className, ...props }: AccordionPanelProps): ReactElement {
  const { id } = useAccordion('AccordionPanel');
  const { value, open } = useItem('AccordionPanel');
  return (
    // A labelled section is a region already; the role would only repeat the element.
    <section
      id={`${id}-panel-${value}`}
      aria-labelledby={`${id}-trigger-${value}`}
      data-slot="accordion-panel"
      data-state={open ? 'open' : 'closed'}
      className="accordion-panel"
    >
      <div className="accordion-track">
        <div className={cn('pb-3 text-muted-foreground', className)} {...props} />
      </div>
    </section>
  );
}
