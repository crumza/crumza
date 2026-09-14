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

interface TabsContext {
  readonly id: string;
  readonly value: string;
  readonly set: (value: string) => void;
  readonly orientation: 'horizontal' | 'vertical';
  readonly activation: 'automatic' | 'manual';
}
const Ctx = createContext<TabsContext | null>(null);

function useTabs(part: string): TabsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error(`<${part}> must be inside <Tabs>`);
  return ctx;
}

export interface TabsProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly orientation?: 'horizontal' | 'vertical' | undefined;
  /** `automatic` selects on arrow-key focus; `manual` waits for Enter or Space. */
  readonly activation?: 'automatic' | 'manual' | undefined;
}

/** Sections of one view, one visible at a time. For a choice among options use SegmentedControl. */
export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  orientation = 'horizontal',
  activation = 'automatic',
  className,
  ...props
}: TabsProps): ReactElement {
  const id = useId();
  const [current, set] = useControllableState({ value, defaultValue, onChange: onValueChange });
  return (
    <Ctx.Provider value={{ id, value: current, set, orientation, activation }}>
      <div
        data-slot="tabs"
        data-orientation={orientation}
        className={cn(
          'flex gap-3',
          orientation === 'horizontal' ? 'flex-col' : 'flex-row',
          className,
        )}
        {...props}
      />
    </Ctx.Provider>
  );
}

export function TabList({ className, onKeyDown, ...props }: ComponentProps<'div'>): ReactElement {
  const { orientation, activation, set } = useTabs('TabList');
  const handleKey = (e: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const rtl =
      getComputedStyle(e.currentTarget).direction === 'rtl' && orientation === 'horizontal';
    const key =
      rtl && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')
        ? e.key === 'ArrowRight'
          ? prev
          : next
        : e.key;
    const dir =
      key === next
        ? 1
        : key === prev
          ? -1
          : key === 'Home'
            ? -Infinity
            : key === 'End'
              ? Infinity
              : 0;
    if (!dir) return;
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    const at = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      dir === -Infinity
        ? 0
        : dir === Infinity
          ? tabs.length - 1
          : (at + dir + tabs.length) % tabs.length;
    const tab = tabs[to];
    if (!tab) return;
    e.preventDefault();
    tab.focus();
    if (activation === 'automatic') set(tab.dataset['value'] ?? '');
  };
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      data-slot="tab-list"
      onKeyDown={handleKey}
      className={cn(
        'flex gap-1',
        orientation === 'horizontal'
          ? 'border-b border-(--border)'
          : 'flex-col border-r border-(--border)',
        className,
      )}
      {...props}
    />
  );
}

export interface TabProps extends Omit<ComponentProps<'button'>, 'value'> {
  readonly value: string;
}

export function Tab({ value, className, onClick, ...props }: TabProps): ReactElement {
  const { id, value: current, set, orientation } = useTabs('Tab');
  const selected = current === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${id}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-slot="tab"
      data-value={value}
      data-state={selected ? 'active' : 'inactive'}
      onClick={(e) => {
        onClick?.(e);
        set(value);
      }}
      className={cn(
        'relative inline-flex h-(--control-md) cursor-pointer select-none items-center gap-2 px-2 text-ui leading-none',
        'text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground',
        'focus-visible:focus-outline outline-none disabled:pointer-events-none disabled:opacity-45',
        'data-[state=active]:text-foreground',
        // The indicator is a hairline that sits on the list's border.
        'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity after:duration-(--duration-fast) after:content-[""]',
        orientation === 'horizontal'
          ? 'after:inset-x-0 after:-bottom-px after:h-0.5'
          : 'after:inset-y-0 after:-right-px after:w-0.5',
        'data-[state=active]:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export interface TabPanelProps extends ComponentProps<'div'> {
  readonly value: string;
  readonly children?: ReactNode;
}

export function TabPanel({ value, className, ...props }: TabPanelProps): ReactElement {
  const { id, value: current } = useTabs('TabPanel');
  const active = current === value;
  return (
    <div
      role="tabpanel"
      id={`${id}-panel-${value}`}
      aria-labelledby={`${id}-tab-${value}`}
      hidden={!active}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: APG makes the tabpanel a tab stop so its content is reachable
      tabIndex={0}
      data-slot="tab-panel"
      className={cn('outline-none focus-visible:focus-outline', className)}
      {...props}
    />
  );
}
