export interface NavItem {
  readonly slug: string;
  readonly label: string;
}
export interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

/** Sidebar order and prev/next. Slugs are docs/ paths without the extension. */
export const sidebar: readonly NavGroup[] = [
  {
    title: 'Start',
    items: [
      { slug: 'getting-started', label: 'Getting started' },
      { slug: 'tokens', label: 'Tokens' },
      { slug: 'material', label: 'The material' },
      { slug: 'theming', label: 'Theming and brands' },
      { slug: 'blocks', label: 'Starter blocks' },
      { slug: 'testing', label: 'Testing' },
    ],
  },
  {
    title: 'Chrome',
    items: [
      { slug: 'components/glass', label: 'Glass' },
      { slug: 'components/lens', label: 'Scene and Lens' },
      { slug: 'components/card', label: 'Card' },
      { slug: 'components/accordion', label: 'Accordion' },
      { slug: 'components/toolbar', label: 'Toolbar' },
      { slug: 'components/tabs', label: 'Tabs' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { slug: 'components/button', label: 'Button' },
      { slug: 'components/toggle', label: 'Toggle' },
      { slug: 'components/segmented-control', label: 'SegmentedControl' },
    ],
  },
  {
    title: 'Forms',
    items: [
      { slug: 'components/input', label: 'Input' },
      { slug: 'components/textarea', label: 'Textarea' },
      { slug: 'components/select', label: 'Select' },
      { slug: 'components/slider', label: 'Slider' },
      { slug: 'components/checkbox', label: 'Checkbox' },
      { slug: 'components/switch', label: 'Switch' },
      { slug: 'components/radio-group', label: 'RadioGroup' },
      { slug: 'components/label', label: 'Label' },
      { slug: 'components/field', label: 'Field' },
      { slug: 'components/date-time-picker', label: 'DateTimePicker' },
      { slug: 'components/time-picker', label: 'TimePicker' },
    ],
  },
  {
    title: 'Overlays',
    items: [
      { slug: 'components/tooltip', label: 'Tooltip' },
      { slug: 'components/hover-card', label: 'HoverCard' },
      { slug: 'components/popover', label: 'Popover' },
      { slug: 'components/dialog', label: 'Dialog' },
      { slug: 'components/drawer', label: 'Drawer' },
      { slug: 'components/menu', label: 'Menu' },
      { slug: 'components/toast', label: 'Toast' },
    ],
  },
  {
    title: 'Facts',
    items: [
      { slug: 'components/badge', label: 'Badge' },
      { slug: 'components/kbd', label: 'Kbd' },
      { slug: 'components/progress', label: 'Progress' },
      { slug: 'components/spinner', label: 'Spinner' },
      { slug: 'components/skeleton', label: 'Skeleton' },
      { slug: 'components/separator', label: 'Separator' },
    ],
  },
];

const flat = sidebar.flatMap((g) => g.items);

export function prevNext(slug: string): { prev: NavItem | undefined; next: NavItem | undefined } {
  const i = flat.findIndex((item) => item.slug === slug);
  return { prev: i > 0 ? flat[i - 1] : undefined, next: i >= 0 ? flat[i + 1] : undefined };
}

export function labelFor(slug: string): string | undefined {
  return flat.find((item) => item.slug === slug)?.label;
}
