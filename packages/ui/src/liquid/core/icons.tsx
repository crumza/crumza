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

export const Upload: IconComponent = icon('upload', [
  ['path', { d: 'M12 3v12' }, '1x0j5s'],
  ['path', { d: 'm17 8-5-5-5 5' }, '7q97r8'],
  ['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }, '1nw6dm'],
]);

export const FolderPlus: IconComponent = icon('folder-plus', [
  ['path', { d: 'M12 10v6' }, '1bos4e'],
  ['path', { d: 'M9 13h6' }, '1uhe8q'],
  [
    'path',
    {
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
    },
    '1kt360',
  ],
]);

export const Pencil: IconComponent = icon('pencil', [
  [
    'path',
    {
      d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
    },
    '1a8usu',
  ],
  ['path', { d: 'm15 5 4 4' }, '1mk7zo'],
]);

export const Camera: IconComponent = icon('camera', [
  [
    'path',
    {
      d: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z',
    },
    '1tc9qg',
  ],
  ['circle', { cx: '12', cy: '13', r: '3' }, '1vg3eu'],
]);

export const Share: IconComponent = icon('share', [
  ['path', { d: 'M12 2v13' }, '1cq2b8'],
  ['path', { d: 'm16 6-4-4-4 4' }, '13yo43'],
  ['path', { d: 'M4 14v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6' }, '1x9dj4'],
]);

export const Link: IconComponent = icon('link', [
  ['path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }, '1cjeqo'],
  ['path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }, '19qd67'],
]);

export const Bookmark: IconComponent = icon('bookmark', [
  ['path', { d: 'm19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z' }, '1fy3hk'],
]);

export const MessageCircle: IconComponent = icon('message-circle', [
  ['path', { d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z' }, 'vv11sd'],
]);

export const Command: IconComponent = icon('command', [
  [
    'path',
    { d: 'M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' },
    '11bfej',
  ],
]);

export const Type: IconComponent = icon('type', [
  ['path', { d: 'M12 4v16' }, '1j8i4o'],
  ['path', { d: 'M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2' }, 'dvhdng'],
  ['path', { d: 'M9 20h6' }, 'w5cbp1'],
]);

export const Bold: IconComponent = icon('bold', [
  [
    'path',
    { d: 'M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8' },
    'mg9rjx',
  ],
]);

export const Italic: IconComponent = icon('italic', [
  ['path', { d: 'M19 4h-9' }, '1p2dx6'],
  ['path', { d: 'M14 20H5' }, '1j0ipq'],
  ['path', { d: 'M15 4 9 20' }, '1kh5ny'],
]);

export const Underline: IconComponent = icon('underline', [
  ['path', { d: 'M6 4v6a6 6 0 0 0 12 0V4' }, '9kb039'],
  ['path', { d: 'M4 20h16' }, 'e4jz7e'],
]);

export const AlignLeft: IconComponent = icon('align-left', [
  ['path', { d: 'M15 12H3' }, '6jk70r'],
  ['path', { d: 'M17 18H3' }, '1amg6g'],
  ['path', { d: 'M21 6H3' }, '1jwq7v'],
]);

export const AlignCenter: IconComponent = icon('align-center', [
  ['path', { d: 'M17 12H7' }, '16if0g'],
  ['path', { d: 'M19 18H5' }, '18s9l3'],
  ['path', { d: 'M21 6H3' }, '1jwq7v'],
]);

export const AlignRight: IconComponent = icon('align-right', [
  ['path', { d: 'M21 12H9' }, 'dn7fvx'],
  ['path', { d: 'M21 18H7' }, '1g6gyg'],
  ['path', { d: 'M21 6H3' }, '1jwq7v'],
]);

export const Moon: IconComponent = icon('moon', [
  ['path', { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' }, 'a7tn18'],
]);

export const Palette: IconComponent = icon('palette', [
  [
    'path',
    {
      d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
    },
    '1gcmc6',
  ],
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }, '1okk4w'],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }, 'f64h9f'],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }, 'qy21gx'],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }, 'fotxhn'],
]);

export const CornerDownLeft: IconComponent = icon('corner-down-left', [
  ['path', { d: 'M20 4v7a4 4 0 0 1-4 4H4' }, '6o5b7l'],
  ['path', { d: 'm9 10-5 5 5 5' }, 'w9m2ki'],
]);
