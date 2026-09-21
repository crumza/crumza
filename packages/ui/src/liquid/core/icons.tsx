import { type ComponentProps, createElement, type ReactElement } from 'react';

/* The handful of glyphs the liquid set draws. Each is the Lucide icon of the same
   name (ISC licence, see THIRD-PARTY.md), rendered with Lucide's default SVG
   attributes so the strokes match pixel for pixel without a runtime dependency.
   Every icon here is decorative: it sits inside a labelled control or next to
   its own text, so it is hidden from assistive technology by default. */

export type IconProps = ComponentProps<'svg'>;
export type IconComponent = (props: IconProps) => ReactElement;

type IconNode = readonly (readonly [
  tag: 'path' | 'circle' | 'rect',
  attrs: Record<string, string>,
  key: string,
])[];

function icon(name: string, nodes: IconNode): IconComponent {
  return function Icon({ className, ...props }: IconProps): ReactElement {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
        className={className ? `lucide lucide-${name} ${className}` : `lucide lucide-${name}`}
      >
        {nodes.map(([tag, attrs, key]) => createElement(tag, { ...attrs, key }))}
      </svg>
    );
  };
}

export const Check: IconComponent = icon('check', [['path', { d: 'M20 6 9 17l-5-5' }, '1gmf2c']]);

export const ChevronLeft: IconComponent = icon('chevron-left', [
  ['path', { d: 'm15 18-6-6 6-6' }, '1wnfg3'],
]);

export const ChevronRight: IconComponent = icon('chevron-right', [
  ['path', { d: 'm9 18 6-6-6-6' }, 'mthhwq'],
]);

export const ChevronDown: IconComponent = icon('chevron-down', [
  ['path', { d: 'm6 9 6 6 6-6' }, 'qrunsl'],
]);

export const X: IconComponent = icon('x', [
  ['path', { d: 'M18 6 6 18' }, '1bl5f8'],
  ['path', { d: 'm6 6 12 12' }, 'd8bk6v'],
]);

export const Minus: IconComponent = icon('minus', [['path', { d: 'M5 12h14' }, '1ays0h']]);

export const Plus: IconComponent = icon('plus', [
  ['path', { d: 'M5 12h14' }, '1ays0h'],
  ['path', { d: 'M12 5v14' }, 's699le'],
]);

export const Search: IconComponent = icon('search', [
  ['path', { d: 'm21 21-4.34-4.34' }, '14j7rj'],
  ['circle', { cx: '11', cy: '11', r: '8' }, '4ej97u'],
]);

export const House: IconComponent = icon('house', [
  ['path', { d: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8' }, '5wwlr5'],
  [
    'path',
    {
      d: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    },
    '1d0kgt',
  ],
]);

export const Compass: IconComponent = icon('compass', [
  [
    'path',
    {
      d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z',
    },
    '9ktpf1',
  ],
  ['circle', { cx: '12', cy: '12', r: '10' }, '1mglay'],
]);

export const Bell: IconComponent = icon('bell', [
  ['path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }, 'vwvbt9'],
  [
    'path',
    {
      d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326',
    },
    '11g9vi',
  ],
]);

export const CircleUser: IconComponent = icon('circle-user', [
  ['circle', { cx: '12', cy: '12', r: '10' }, '1mglay'],
  ['circle', { cx: '12', cy: '10', r: '3' }, 'ilqhr7'],
  ['path', { d: 'M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662' }, '154egf'],
]);

export const Star: IconComponent = icon('star', [
  [
    'path',
    {
      d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
    },
    'r04s7s',
  ],
]);

export const Pipette: IconComponent = icon('pipette', [
  [
    'path',
    {
      d: 'm12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12',
    },
    '1y3wsu',
  ],
  [
    'path',
    { d: 'm18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z' },
    '110lr1',
  ],
  ['path', { d: 'm2 22 .414-.414' }, 'jhxm08'],
]);

export const Copy: IconComponent = icon('copy', [
  ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }, '17jyea'],
  ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }, 'zix9uf'],
]);

export const Scissors: IconComponent = icon('scissors', [
  ['circle', { cx: '6', cy: '6', r: '3' }, '1lh9wr'],
  ['path', { d: 'M8.12 8.12 12 12' }, '1alkpv'],
  ['path', { d: 'M20 4 8.12 15.88' }, 'xgtan2'],
  ['circle', { cx: '6', cy: '18', r: '3' }, 'fqmcym'],
  ['path', { d: 'M14.8 14.8 20 20' }, 'ptml3r'],
]);

export const Sparkles: IconComponent = icon('sparkles', [
  [
    'path',
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    },
    '1s2grr',
  ],
  ['path', { d: 'M20 2v4' }, '1rf3ol'],
  ['path', { d: 'M22 4h-4' }, 'gwowj6'],
  ['circle', { cx: '4', cy: '20', r: '2' }, '6kqj1y'],
]);

export const CornerUpLeft: IconComponent = icon('corner-up-left', [
  ['path', { d: 'M20 20v-7a4 4 0 0 0-4-4H4' }, '1nkjon'],
  ['path', { d: 'M9 14 4 9l5-5' }, '102s5s'],
]);

export const Trash2: IconComponent = icon('trash-2', [
  ['path', { d: 'M10 11v6' }, 'nco0om'],
  ['path', { d: 'M14 11v6' }, 'outv1u'],
  ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }, 'miytrc'],
  ['path', { d: 'M3 6h18' }, 'd0wm0j'],
  ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }, 'e791ji'],
]);

export const Heart: IconComponent = icon('heart', [
  [
    'path',
    {
      d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    },
    'c3ymky',
  ],
]);

export const Archive: IconComponent = icon('archive', [
  ['rect', { width: '20', height: '5', x: '2', y: '3', rx: '1' }, '1m3agn'],
  ['path', { d: 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8' }, '1w9u4o'],
  ['path', { d: 'M10 12h4' }, '1z2b8l'],
]);

export const ChevronsUpDown: IconComponent = icon('chevrons-up-down', [
  ['path', { d: 'm7 15 5 5 5-5' }, '1hf1tw'],
  ['path', { d: 'm7 9 5-5 5 5' }, 'sgt6xg'],
]);

export const ArrowLeft: IconComponent = icon('arrow-left', [
  ['path', { d: 'm12 19-7-7 7-7' }, '1l729n'],
  ['path', { d: 'M19 12H5' }, 'x3x0zl'],
]);

export const User: IconComponent = icon('user', [
  ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }, '975kel'],
  ['circle', { cx: '12', cy: '7', r: '4' }, '17ys0d'],
]);

export const Briefcase: IconComponent = icon('briefcase', [
  ['path', { d: 'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' }, 'jecpp'],
  ['rect', { width: '20', height: '14', x: '2', y: '6', rx: '2' }, 'i6l2r4'],
]);

export const Lightbulb: IconComponent = icon('lightbulb', [
  [
    'path',
    {
      d: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5',
    },
    '1gvzjb',
  ],
  ['path', { d: 'M9 18h6' }, 'x1upvd'],
  ['path', { d: 'M10 22h4' }, 'ceow96'],
]);

export const IdCard: IconComponent = icon('id-card', [
  ['path', { d: 'M16 10h2' }, '8sgtl7'],
  ['path', { d: 'M16 14h2' }, 'epxaof'],
  ['path', { d: 'M6.17 15a3 3 0 0 1 5.66 0' }, 'n6f512'],
  ['circle', { cx: '9', cy: '11', r: '2' }, 'yxgjnd'],
  ['rect', { x: '2', y: '5', width: '20', height: '14', rx: '2' }, 'qneu4z'],
]);

export const PaintbrushVertical: IconComponent = icon('paintbrush-vertical', [
  ['path', { d: 'M10 2v2' }, '7u0qdc'],
  ['path', { d: 'M14 2v4' }, 'qmzblu'],
  ['path', { d: 'M17 2a1 1 0 0 1 1 1v9H6V3a1 1 0 0 1 1-1z' }, 'ycvu00'],
  [
    'path',
    {
      d: 'M6 12a1 1 0 0 0-1 1v1a2 2 0 0 0 2 2h2a1 1 0 0 1 1 1v2.9a2 2 0 1 0 4 0V17a1 1 0 0 1 1-1h2a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1',
    },
    'iw4wnp',
  ],
]);

export const UserPlus: IconComponent = icon('user-plus', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }, '1yyitq'],
  ['circle', { cx: '9', cy: '7', r: '4' }, 'nufk8'],
  ['path', { d: 'M19 8v6' }, '1w7bmk'],
  ['path', { d: 'M22 11h-6' }, 'nfh3x8'],
]);

export const LogOut: IconComponent = icon('log-out', [
  ['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }, '1uf3rs'],
  ['path', { d: 'm16 17 5-5-5-5' }, '1bji2h'],
  ['path', { d: 'M21 12H9' }, 'dn1m92'],
]);

export const Settings2: IconComponent = icon('settings-2', [
  ['path', { d: 'M20 7h-9' }, '3s1dr2'],
  ['path', { d: 'M14 17H5' }, 'gfn3mx'],
  ['circle', { cx: '17', cy: '17', r: '3' }, '18b49y'],
  ['circle', { cx: '7', cy: '7', r: '3' }, 'dfmy0x'],
]);
