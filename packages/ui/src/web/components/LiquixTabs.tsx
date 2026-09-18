import type { ComponentType, ReactElement } from 'react';
import { LiquixBar } from './liquix-bar';

const HEIGHT = 56;

export interface LiquixTabsShadowProps {
  /** The surface's width in CSS px. */
  readonly width: number;
  /** CSS px between the surface's edge and the bar's, each side. */
  readonly inset?: number | undefined;
  /** CSS px from the surface's bottom edge to the bar's. */
  readonly bottom?: number | undefined;
  /** The bar's height in CSS px. */
  readonly height?: number | undefined;
}

/**
 * The drop shadow, which the shader cannot draw: with everything outside the
 * glass cut away, its own shadow survives only where the glass refracts it, as
 * a dirty ring inside the rim. Pass this to the surface's `underlay`, because
 * anything in front of the canvas would lay the shadow over the glass instead
 * of under it.
 */
export function LiquixTabsShadow({
  width,
  inset = 14,
  bottom = 28,
  height = HEIGHT,
}: LiquixTabsShadowProps): ReactElement {
  return (
    <div
      data-slot="liquix-tabs-shadow"
      className="absolute inset-x-0"
      style={{ bottom: `${bottom}px` }}
    >
      <div
        aria-hidden="true"
        style={{
          width: `${Math.max(0, width - inset * 2)}px`,
          height: `${height}px`,
          borderRadius: `${height / 2}px`,
        }}
        className="mx-auto shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
      />
    </div>
  );
}

export interface LiquixTab {
  readonly id: string;
  readonly label: string;
  /** Inherits size and colour from the tab, so the tab styling drives it. */
  readonly Icon: ComponentType;
  readonly disabled?: boolean | undefined;
}

export interface LiquixTabsProps {
  readonly tabs: readonly LiquixTab[];
  /** The selected id. */
  readonly active: string;
  /** Called with the id of the tab that was chosen. */
  readonly onChange: (id: string) => void;
  /**
   * The surface's width in CSS px. The bar is measured from it rather than
   * from its own layout, because the shader needs the box in the same units
   * it is given everything else.
   */
  readonly width: number;
  /** CSS px between the surface's edge and the bar's, each side. */
  readonly inset?: number | undefined;
  /** CSS px from the surface's bottom edge to the bar's. */
  readonly bottom?: number | undefined;
  /** The bar's height in CSS px. */
  readonly height?: number | undefined;
  /** The accessible name of the tablist. */
  readonly label?: string | undefined;
  /**
   * Classes for the labels where the capsule is. The colour follows the
   * capsule rather than the selection: whatever part of an icon or label sits
   * inside its outline is drawn with these, the rest with inactiveClassName,
   * so a label changes colour as the capsule slides over it.
   */
  readonly activeClassName?: string | undefined;
  /** Classes for the labels outside the capsule. White with a drop shadow, so they read over any picture. */
  readonly inactiveClassName?: string | undefined;
  /**
   * Classes added to the parked highlight, the capsule the glass settles into.
   * By default it is translucent grey over a backdrop blur, so the bar and the
   * content behind still show through softly; a background utility replaces
   * the grey.
   */
  readonly pillClassName?: string | undefined;
}

/**
 * A tab bar made of glass, for the `overlay` of a LiquixSurface.
 *
 * The bar is one capsule of glass refracting whatever is under it, and the
 * selected tab's highlight turns to glass while it travels between tabs, then
 * settles back into a flat capsule. Every tab is a real `<button>` in a
 * tablist; the glass is drawn by the surface's shader on the canvas below.
 * The motion is the LiquixBar's, shared with every other liquix choice control.
 */
export function LiquixTabs({
  tabs,
  active,
  onChange,
  width,
  inset = 14,
  bottom = 28,
  height = HEIGHT,
  label = 'Sections',
  activeClassName = 'text-blue-600',
  inactiveClassName = 'liquix-ink',
  pillClassName,
}: LiquixTabsProps): ReactElement {
  const barWidth = Math.max(0, width - inset * 2);
  return (
    <div
      data-slot="liquix-tabs"
      className="pointer-events-none absolute inset-x-0"
      style={{ bottom: `${bottom}px` }}
    >
      <LiquixBar
        slot="liquix-tabs"
        className="pointer-events-auto mx-auto"
        style={{ width: `${barWidth}px` }}
        initialWidth={barWidth}
        height={height}
        pillInset={4}
        pane
        items={tabs.map((tab) => ({
          id: tab.id,
          disabled: tab.disabled,
          label: (
            <>
              <tab.Icon />
              <span className="text-[11px] font-semibold tracking-[0.08em]">{tab.label}</span>
            </>
          ),
        }))}
        itemClassName="flex-col gap-[3px]"
        active={active}
        onChange={onChange}
        label={label}
        listRole="tablist"
        itemRole="tab"
        selectOnArrow
        activeClassName={activeClassName}
        inactiveClassName={inactiveClassName}
        pillClassName={pillClassName}
      />
    </div>
  );
}
