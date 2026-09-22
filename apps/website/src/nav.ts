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
    title: 'Liquid glass',
    items: [
      { slug: 'liquid', label: 'LiquidScene' },
      { slug: 'components/liquid-pricing-card', label: 'LiquidPricingCard' },
      { slug: 'components/liquid-testimonials', label: 'LiquidTestimonials' },
      { slug: 'components/liquid-header', label: 'LiquidHeader' },
      { slug: 'components/liquid-mobile-nav', label: 'LiquidMobileNav' },
      { slug: 'components/liquid-tab-indicator', label: 'LiquidTabIndicator' },
      { slug: 'components/liquid-search', label: 'LiquidSearch' },
      { slug: 'components/liquid-stepper', label: 'LiquidStepper' },
      { slug: 'components/liquid-glass-toggle', label: 'LiquidGlassToggle' },
      { slug: 'components/liquid-glass-slider', label: 'LiquidGlassSlider' },
      { slug: 'components/liquid-color-picker', label: 'LiquidColorPicker' },
      { slug: 'components/liquid-notification-stack', label: 'LiquidNotification\u00adStack' },
      { slug: 'components/liquid-context-menu', label: 'LiquidContextMenu' },
      { slug: 'components/liquid-dock-menu', label: 'LiquidDockMenu' },
      { slug: 'components/liquid-gallery', label: 'LiquidGallery' },
      { slug: 'components/liquid-sheet', label: 'LiquidSheet' },
      { slug: 'components/liquid-plus-button', label: 'LiquidPlusButton' },
      { slug: 'components/liquid-menu-button', label: 'LiquidMenuButton' },
      { slug: 'components/liquid-action-pill', label: 'LiquidActionPill' },
      { slug: 'components/liquid-action-dock', label: 'LiquidActionDock' },
      { slug: 'components/liquid-context-toolbar', label: 'LiquidContextToolbar' },
      { slug: 'components/liquid-command-palette', label: 'LiquidCommandPalette' },
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
    title: 'Liquix',
    items: [
      { slug: 'components/liquix-stage', label: 'LiquixStage' },
      { slug: 'components/liquix-capsule', label: 'LiquixCapsule' },
      { slug: 'components/liquix-circle', label: 'LiquixCircle' },
      { slug: 'components/liquix-surface', label: 'LiquixSurface' },
      { slug: 'components/liquix-tabs', label: 'LiquixTabs' },
      { slug: 'components/liquix-segmented-control', label: 'LiquixSegmentedControl' },
      { slug: 'components/liquix-button', label: 'LiquixButton' },
      { slug: 'components/liquix-field', label: 'LiquixField' },
      { slug: 'components/liquix-switch', label: 'LiquixSwitch' },
      { slug: 'components/liquix-menu', label: 'LiquixMenu' },
      { slug: 'components/liquix-popover', label: 'LiquixPopover' },
      { slug: 'components/liquix-toast', label: 'LiquixToast' },
      { slug: 'components/liquix-frosted', label: 'LiquixFrosted' },
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
