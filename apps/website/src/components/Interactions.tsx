import {
  LiquidActionDock,
  LiquidActionPill,
  LiquidCommandPalette,
  LiquidContextToolbar,
  LiquidDockMenu,
  LiquidGlassToggle,
  LiquidMenuButton,
  LiquidNotificationStack,
  LiquidPlusButton,
  LiquidScene,
  LiquidSearch,
  LiquidSheet,
} from '@crumza/ui/liquid';
import type { ReactElement, ReactNode } from 'react';

interface Interaction {
  readonly title: string;
  readonly component: string;
  readonly href: string;
  readonly note: string;
  readonly scene: string;
  readonly height: number;
  readonly render: () => ReactNode;
}

/* Ten interactions, each one component on its own refracting stage. The
   scenes are the site's own; the order runs from the smallest morph to the
   largest. Every one answers a press, the keyboard and Escape, and every one
   goes back the way it came. */
const interactions: readonly Interaction[] = [
  {
    title: 'Morphing plus',
    component: 'LiquidPlusButton',
    href: 'liquid-plus-button',
    note: 'A plus grows into a menu of actions; a choice folds it back.',
    scene: '/liquid/ridge.jpg',
    height: 340,
    render: () => <LiquidPlusButton />,
  },
  {
    title: 'Morphing menu',
    component: 'LiquidMenuButton',
    href: 'liquid-menu-button',
    note: 'Three bars fold into a cross as the round grows into a menu.',
    scene: '/liquid/bloom.png',
    height: 340,
    render: () => <LiquidMenuButton />,
  },
  {
    title: 'Expandable pill',
    component: 'LiquidActionPill',
    href: 'liquid-action-pill',
    note: 'One glyph widens into a row of actions that pour from its edge.',
    scene: '/liquid/duotone.png',
    height: 300,
    render: () => <LiquidActionPill />,
  },
  {
    title: 'Action dock',
    component: 'LiquidActionDock',
    href: 'liquid-action-dock',
    note: 'Satellites emerge from behind the button into an arc, and go back in.',
    scene: '/liquid/ambience.svg',
    height: 340,
    render: () => <LiquidActionDock />,
  },
  {
    title: 'Contextual toolbar',
    component: 'LiquidContextToolbar',
    href: 'liquid-context-toolbar',
    note: 'A bar lifts out of its icon and widens above it, then settles back.',
    scene: '/liquid/sky.svg',
    height: 300,
    render: () => <LiquidContextToolbar />,
  },
  {
    title: 'Expandable search',
    component: 'LiquidSearch',
    href: 'liquid-search',
    note: 'A round grows into a field; results rise beneath; empty, it folds.',
    scene: '/liquid/ridge.jpg',
    height: 340,
    render: () => <LiquidSearch />,
  },
  {
    title: 'Notification stack',
    component: 'LiquidNotificationStack',
    href: 'liquid-notification-stack',
    note: 'A deck that fans into a column on hover and collapses again.',
    scene: '/liquid/bloom.png',
    height: 460,
    render: () => <LiquidNotificationStack />,
  },
  {
    title: 'Command palette',
    component: 'LiquidCommandPalette',
    href: 'liquid-command-palette',
    note: 'A button becomes a focused field with the commands beneath it.',
    scene: '/liquid/duotone.png',
    height: 460,
    render: () => <LiquidCommandPalette />,
  },
  {
    title: 'Toggle morph',
    component: 'LiquidGlassToggle',
    href: 'liquid-glass-toggle',
    note: 'The thumb lifts into a lens under a finger and settles white.',
    scene: '/liquid/ambience.svg',
    height: 300,
    render: () => <LiquidGlassToggle aria-label="Wi-Fi" defaultChecked />,
  },
  {
    title: 'Draggable sheet',
    component: 'LiquidSheet',
    href: 'liquid-sheet',
    note: 'A sheet rises from the foot; pull its handle down to dismiss it.',
    scene: '/liquid/sky.svg',
    height: 420,
    render: () => <LiquidSheet />,
  },
  {
    title: 'Dock that unfolds',
    component: 'LiquidDockMenu',
    href: 'liquid-dock-menu',
    note: 'A pill of glyphs squashes, then grows up into a paged menu.',
    scene: '/liquid/ridge.jpg',
    height: 360,
    render: () => <LiquidDockMenu />,
  },
];

/** Every morph in the liquid set, one to a stage, with a line on what to try. */
export default function Interactions(): ReactElement {
  return (
    <section className="liquid-section" aria-label="Interactions">
      <div className="liquid-head">
        <div>
          <h2>Interactions</h2>
          <span className="liquid-count">{interactions.length} morphs</span>
        </div>
        <p>
          Every control here is one pane of glass whose box changes, or a pane that travels, and
          never a scaled picture of one. Press each, then press outside or Escape, and watch it go
          back the way it came.
        </p>
      </div>
      <div className="collection-grid">
        {interactions.map((item) => (
          <div key={item.component} className="collection-item">
            <LiquidScene
              background={item.scene}
              className="interaction-stage"
              style={{ height: item.height }}
            >
              {item.render()}
            </LiquidScene>
            <a className="tile-label" href={`/docs/components/${item.href}`}>
              <strong>{item.title}</strong>
              <span>{item.component}</span>
            </a>
            <p className="interaction-note">{item.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
