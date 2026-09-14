import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Glass,
  Input,
  Kbd,
  Lens,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Radio,
  RadioGroup,
  Scene,
  Segment,
  SegmentedControl,
  Select,
  Separator,
  Slider,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Toaster,
  Toggle,
  Toolbar,
  Tooltip,
  toast,
} from '@crumza/ui/web';
import type { ComponentType, ReactElement } from 'react';
import { useState } from 'react';
import { Frame } from './Frame';

function ButtonDemo(): ReactElement {
  return (
    <Frame>
      <Button>Liquid glass</Button>
      <Button tone="primary">Primary</Button>
      <Button tone="secondary">Secondary</Button>
      <Button variant="muted">Muted</Button>
      <Button variant="bordered">Bordered</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button radius={8}>Local radius</Button>
      <Button disabled>Disabled</Button>
    </Frame>
  );
}

function LensDemo(): ReactElement {
  const backdrop = [
    'radial-gradient(circle at 20% 30%, oklch(0.78 0.19 35) 0, transparent 40%)',
    'radial-gradient(circle at 80% 60%, oklch(0.72 0.19 300) 0, transparent 42%)',
    'repeating-linear-gradient(0deg, oklch(0.2 0 0 / 0.2) 0 1.5px, transparent 1.5px 32px)',
    'repeating-linear-gradient(90deg, oklch(0.99 0 0 / 0.6) 0 1.5px, transparent 1.5px 40px)',
    'linear-gradient(oklch(0.96 0.02 80), oklch(0.9 0.03 250))',
  ].join(', ');
  return (
    <Scene backdrop={backdrop} className="relative h-56 overflow-clip rounded-surface border border-(--border)">
      <Lens interactive className="absolute top-6 left-6 w-60 rounded-2xl p-4">
        <span className="text-ui">Press me: the rim bends harder.</span>
      </Lens>
      <Lens className="absolute right-6 bottom-6 size-12 rounded-full" aria-hidden="true" />
      <Lens className="absolute right-24 bottom-6 h-10 rounded-full px-4" aria-hidden="true">
        <span className="flex h-full items-center text-ui font-control">Pill</span>
      </Lens>
    </Scene>
  );
}

function GlassDemo(): ReactElement {
  return (
    <Frame tall>
      <Glass material="liquid" className="grid max-w-sm gap-3 p-5">
        <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">a slab of chrome</span>
        <p className="text-ui">Labels, controls and short headings live on glass. Documents never do.</p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm">
            Share
          </Button>
          <Button variant="secondary" size="sm">
            Glass inside glass becomes a fill
          </Button>
        </div>
      </Glass>
    </Frame>
  );
}

function CardDemo(): ReactElement {
  return (
    <Frame>
      <Card className="grid max-w-sm gap-2 p-5">
        <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">opaque content</span>
        <p className="text-ui">A card is one step up from the canvas, separated by a hairline. Forms and text live here.</p>
      </Card>
    </Frame>
  );
}

function ToolbarDemo(): ReactElement {
  return (
    <Frame>
      <Toolbar aria-label="Formatting" className="gap-3">
        <Glass className="flex gap-0.5 p-1">
          <Button size="sm" variant="ghost" shape="rect">
            Undo
          </Button>
          <Button size="sm" variant="ghost" shape="rect">
            Redo
          </Button>
        </Glass>
        <Glass className="flex gap-0.5 p-1">
          <Toggle size="sm" defaultPressed aria-label="Bold" className="font-semibold">
            B
          </Toggle>
          <Toggle size="sm" aria-label="Italic" className="italic">
            I
          </Toggle>
          <Separator orientation="vertical" className="mx-1" />
          <Toggle size="sm" aria-label="Underline" className="underline">
            U
          </Toggle>
        </Glass>
        <span className="flex-1" />
        <Button size="sm" variant="primary">
          Share
        </Button>
      </Toolbar>
    </Frame>
  );
}

function TabsDemo(): ReactElement {
  return (
    <Frame>
      <Card className="w-full max-w-md p-5">
        <Tabs defaultValue="style">
          <TabList aria-label="Inspector">
            <Tab value="style">Style</Tab>
            <Tab value="layout">Layout</Tab>
            <Tab value="export" disabled>
              Export
            </Tab>
          </TabList>
          <TabPanel value="style" className="text-ui text-muted-foreground">
            Paragraph styles, fonts and colors.
          </TabPanel>
          <TabPanel value="layout" className="text-ui text-muted-foreground">
            Margins, columns and page size.
          </TabPanel>
          <TabPanel value="export" />
        </Tabs>
      </Card>
    </Frame>
  );
}

function ToggleDemo(): ReactElement {
  return (
    <Frame>
      <Glass className="flex gap-0.5 p-1">
        <Toggle defaultPressed aria-label="Bold" className="font-semibold">
          B
        </Toggle>
        <Toggle aria-label="Italic" className="italic">
          I
        </Toggle>
        <Toggle aria-label="Underline" className="underline">
          U
        </Toggle>
      </Glass>
    </Frame>
  );
}

function SegmentedDemo(): ReactElement {
  const [v, setV] = useState('left');
  return (
    <Frame>
      <SegmentedControl value={v} onValueChange={setV} aria-label="Alignment">
        <Segment value="left">Left</Segment>
        <Segment value="center">Center</Segment>
        <Segment value="right">Right</Segment>
      </SegmentedControl>
    </Frame>
  );
}

function FormDemo(): ReactElement {
  const [zoom, setZoom] = useState(100);
  return (
    <Frame>
      <Card className="grid w-full max-w-md gap-4 p-5">
        <Field label="Document title" htmlFor="d-title" description="Shown in the window title bar.">
          <Input id="d-title" defaultValue="Q3 planning" />
        </Field>
        <Field label="Summary" htmlFor="d-summary" error="Keep it under 280 characters." required>
          <Textarea id="d-summary" aria-invalid="true" defaultValue="A short abstract that is slightly too long." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paper" htmlFor="d-paper">
            <Select id="d-paper" defaultValue="a4">
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </Select>
          </Field>
          <Field label={`Zoom ${zoom}%`} htmlFor="d-zoom">
            <Slider id="d-zoom" min={50} max={200} step={10} value={zoom} onValueChange={setZoom} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Checkbox label="Track changes" defaultChecked />
          <Switch label="Autosave" defaultChecked />
        </div>
        <RadioGroup defaultValue="a4" orientation="horizontal" aria-label="Paper size">
          <Radio value="a4" label="A4" />
          <Radio value="letter" label="Letter" />
          <Radio value="legal" label="Legal" disabled />
        </RadioGroup>
      </Card>
    </Frame>
  );
}

function TooltipDemo(): ReactElement {
  return (
    <Frame>
      <Tooltip content="Bold ⌘B">
        <Button size="icon" aria-label="Bold" className="font-semibold">
          B
        </Button>
      </Tooltip>
      <Tooltip content="Tooltips repeat the label" side="bottom">
        <Button size="icon" aria-label="Help">
          ?
        </Button>
      </Tooltip>
    </Frame>
  );
}

function PopoverDemo(): ReactElement {
  return (
    <Frame tall>
      <Popover>
        <PopoverTrigger render={<Button />}>Page setup</PopoverTrigger>
        <PopoverContent align="start" className="grid gap-3">
          <Field label="Top margin" htmlFor="p-top">
            <Input id="p-top" size="sm" defaultValue="2.54 cm" />
          </Field>
          <Checkbox label="Mirror margins" />
        </PopoverContent>
      </Popover>
    </Frame>
  );
}

function DialogDemo(): ReactElement {
  return (
    <Frame>
      <Dialog>
        <DialogTrigger render={<Button variant="outline" />}>Delete document</DialogTrigger>
        <DialogContent className="grid gap-4">
          <DialogTitle>Delete "Q3 planning"?</DialogTitle>
          <DialogDescription>This removes the document for everyone. There is no undo.</DialogDescription>
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="ghost" shape="rect" />}>Cancel</DialogClose>
            <DialogClose render={<Button variant="destructive" shape="rect" />}>Delete</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </Frame>
  );
}

function MenuDemo(): ReactElement {
  return (
    <Frame tall>
      <Menu>
        <MenuTrigger render={<Button />}>File</MenuTrigger>
        <MenuContent>
          <MenuItem shortcut="⌘N">New document</MenuItem>
          <MenuItem shortcut="⌘S">Save</MenuItem>
          <MenuItem disabled>Revert</MenuItem>
          <MenuSeparator />
          <MenuLabel>View</MenuLabel>
          <MenuCheckboxItem defaultChecked>Ruler</MenuCheckboxItem>
          <MenuRadioGroup defaultValue="page">
            <MenuRadioItem value="page">Page layout</MenuRadioItem>
            <MenuRadioItem value="draft">Draft</MenuRadioItem>
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </Frame>
  );
}

function ToastDemo(): ReactElement {
  return (
    <Frame>
      <Button variant="secondary" onClick={() => toast('Document saved', { description: 'Q3 planning, just now.' })}>
        Toast
      </Button>
      <Button variant="secondary" onClick={() => toast.success('Exported to PDF', { action: { label: 'Open', onClick: () => undefined } })}>
        Success with action
      </Button>
      <Button variant="secondary" onClick={() => toast.error('Export failed', { duration: 0 })}>
        Error, sticky
      </Button>
      <Toaster />
    </Frame>
  );
}

function FactsDemo(): ReactElement {
  return (
    <Frame>
      <Badge variant="accent">New</Badge>
      <Badge>Draft</Badge>
      <Badge variant="outline">v0.1</Badge>
      <Badge variant="destructive">Failing</Badge>
      <span className="inline-flex items-center gap-1 text-ui-sm text-muted-foreground">
        Command palette <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
      <Separator className="w-full" />
      <div className="grid w-full max-w-sm gap-3">
        <Progress value={42} aria-label="Export progress" />
        <Progress aria-label="Indexing" />
      </div>
    </Frame>
  );
}

/** Which live demo sits above which docs page. Slugs match the docs/ file paths. */
const demos: Record<string, ComponentType> = {
  'components/button': ButtonDemo,
  'components/glass': GlassDemo,
  'components/lens': LensDemo,
  'components/card': CardDemo,
  'components/toolbar': ToolbarDemo,
  'components/tabs': TabsDemo,
  'components/toggle': ToggleDemo,
  'components/segmented-control': SegmentedDemo,
  'components/input': FormDemo,
  'components/textarea': FormDemo,
  'components/select': FormDemo,
  'components/slider': FormDemo,
  'components/checkbox': FormDemo,
  'components/switch': FormDemo,
  'components/radio-group': FormDemo,
  'components/label': FormDemo,
  'components/field': FormDemo,
  'components/tooltip': TooltipDemo,
  'components/popover': PopoverDemo,
  'components/dialog': DialogDemo,
  'components/menu': MenuDemo,
  'components/toast': ToastDemo,
  'components/badge': FactsDemo,
  'components/kbd': FactsDemo,
  'components/progress': FactsDemo,
  'components/separator': FactsDemo,
  material: GlassDemo,
};

export function hasDemo(slug: string): boolean {
  return slug in demos;
}

/** One statically imported island; Astro cannot hydrate a component picked from a map. */
export function Demos({ slug }: { readonly slug: string }): ReactElement | null {
  const Demo = demos[slug];
  return Demo ? <Demo /> : null;
}
