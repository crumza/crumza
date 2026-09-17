import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  Checkbox,
  DateTimePicker,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
  type DrawerSide,
  Field,
  Glass,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Kbd,
  Label,
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
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  TimePicker,
  Toaster,
  Toggle,
  Toolbar,
  Tooltip,
  toast,
} from '@crumza/ui/web';
import {
  LiquidColorPicker,
  LiquidContextMenu,
  LiquidGallery,
  LiquidHeader,
  LiquidMobileNav,
  LiquidNotificationStack,
  LiquidPricingCard,
  LiquidSearch,
  LiquidStepper,
  LiquidTabIndicator,
  LiquidTestimonials,
} from '@crumza/ui/liquid';
import type { ComponentType, ReactElement } from 'react';
import { useState } from 'react';
import { Frame } from './Frame';
import {
  LiquixButtonDemo,
  LiquixFieldDemo,
  LiquixMenuDemo,
  LiquixPopoverDemo,
  LiquixSegmentedDemo,
  LiquixSwitchDemo,
  LiquixToastDemo,
} from './LiquixControlDemos';
import { LiquixTabsDemo } from './LiquixTabsDemo';
import { liquidGalleryImages } from './liquid';
import { LiquidFrame } from './LiquidFrame';

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

function AccordionDemo(): ReactElement {
  return (
    <Frame>
      <Card className="w-full max-w-md px-5 py-2">
        <Accordion defaultValue={['several']}>
          <AccordionItem value="several">
            <AccordionTrigger>Can more than one section stay open?</AccordionTrigger>
            <AccordionPanel>
              Set multiple. The open items are an array either way, so the shape of the value
              never changes.
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem value="always">
            <AccordionTrigger>Can a section stay open for good?</AccordionTrigger>
            <AccordionPanel>
              Turn collapsible off. The open section then holds until another one takes its
              place.
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem value="brand">
            <AccordionTrigger>Will it match my brand?</AccordionTrigger>
            <AccordionPanel>
              It inherits the Theme around it: material, radius, density and colour pairs all
              come from there.
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Card>
    </Frame>
  );
}

function DateTimePickerDemo(): ReactElement {
  const [when, setWhen] = useState<Date | null>(null);
  const [day, setDay] = useState<Date | null>(null);
  return (
    <Frame>
      <Card className="grid w-full max-w-md gap-4 p-5">
        <Field label="Starts at" htmlFor="demo-starts" description="Date and time, local.">
          <DateTimePicker id="demo-starts" value={when} onValueChange={setWhen} />
        </Field>
        <Field label="Deadline" htmlFor="demo-deadline" description="Date only, this month on.">
          <DateTimePicker
            id="demo-deadline"
            value={day}
            onValueChange={setDay}
            time={false}
            min={new Date()}
            placeholder="Pick a day"
          />
        </Field>
      </Card>
    </Frame>
  );
}

function TimePickerDemo(): ReactElement {
  const [at, setAt] = useState<string | null>('09:05');
  const [slot, setSlot] = useState<string | null>(null);
  return (
    <Frame>
      <Card className="grid w-full max-w-md gap-4 p-5">
        <Field label="Starts at" htmlFor="demo-at" description={`Reports ${at ?? 'nothing'}.`}>
          <TimePicker id="demo-at" value={at} onValueChange={setAt} />
        </Field>
        <Field label="Slot" htmlFor="demo-slot" description="Quarter hours, to the second.">
          <TimePicker
            id="demo-slot"
            value={slot}
            onValueChange={setSlot}
            minuteStep={15}
            seconds
            hourCycle={24}
          />
        </Field>
      </Card>
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

/** Form controls belong on an opaque surface, so each of these sits on a Card. */
function FormCard({ children }: { children: ReactElement | readonly ReactElement[] }): ReactElement {
  return (
    <Frame>
      <Card className="grid w-full max-w-md gap-4 p-5">{children}</Card>
    </Frame>
  );
}

function InputDemo(): ReactElement {
  return (
    <FormCard>
      <Field label="Small" htmlFor="in-sm">
        <Input id="in-sm" size="sm" placeholder="sm" />
      </Field>
      <Field label="Medium" htmlFor="in-md" description="The default size.">
        <Input id="in-md" placeholder="md" />
      </Field>
      <Field label="Large" htmlFor="in-lg">
        <Input id="in-lg" size="lg" placeholder="lg" />
      </Field>
      <Field label="Invalid" htmlFor="in-bad" error="That address is not recognised." required>
        <Input id="in-bad" aria-invalid="true" defaultValue="not-an-address" required />
      </Field>
      <Field label="Disabled" htmlFor="in-off">
        <Input id="in-off" disabled defaultValue="Locked" />
      </Field>
    </FormCard>
  );
}

function TextareaDemo(): ReactElement {
  return (
    <FormCard>
      <Field label="Empty" htmlFor="ta-empty" description="Drag the corner to resize vertically.">
        <Textarea id="ta-empty" placeholder="Say something" />
      </Field>
      <Field label="Invalid" htmlFor="ta-bad" error="Keep it under 280 characters." required>
        <Textarea
          id="ta-bad"
          aria-invalid="true"
          required
          defaultValue="A short abstract that is slightly too long for the field, apparently."
        />
      </Field>
      <Field label="Disabled" htmlFor="ta-off">
        <Textarea id="ta-off" disabled defaultValue="Locked" />
      </Field>
    </FormCard>
  );
}

function SelectDemo(): ReactElement {
  const papers = (
    <>
      <option value="a4">A4</option>
      <option value="letter">US Letter</option>
      <option value="legal">Legal</option>
    </>
  );
  return (
    <FormCard>
      <Field label="Small" htmlFor="se-sm">
        <Select id="se-sm" size="sm" defaultValue="a4">
          {papers}
        </Select>
      </Field>
      <Field label="Medium" htmlFor="se-md" description="The popup is the operating system's.">
        <Select id="se-md" defaultValue="letter">
          {papers}
        </Select>
      </Field>
      <Field label="Large" htmlFor="se-lg">
        <Select id="se-lg" size="lg" defaultValue="legal">
          {papers}
        </Select>
      </Field>
      <Field label="Disabled" htmlFor="se-off">
        <Select id="se-off" disabled defaultValue="a4">
          {papers}
        </Select>
      </Field>
    </FormCard>
  );
}

function SliderDemo(): ReactElement {
  const [zoom, setZoom] = useState(100);
  const [volume, setVolume] = useState(2);
  const names = ['Silent', 'Quiet', 'Comfortable', 'Loud'] as const;
  return (
    <FormCard>
      <Field label={`Zoom ${zoom}%`} htmlFor="sl-zoom" description="50 to 200 in steps of 10.">
        <Slider id="sl-zoom" min={50} max={200} step={10} value={zoom} onValueChange={setZoom} />
      </Field>
      <Field label={`Level: ${names[volume]}`} htmlFor="sl-vol">
        {/* The number alone means nothing here, so the thumb announces the word instead. */}
        <Slider
          id="sl-vol"
          min={0}
          max={3}
          value={volume}
          onValueChange={setVolume}
          aria-valuetext={names[volume]}
        />
      </Field>
      <Field label="Disabled" htmlFor="sl-off">
        <Slider id="sl-off" defaultValue={40} disabled />
      </Field>
    </FormCard>
  );
}

function CheckboxDemo(): ReactElement {
  return (
    <FormCard>
      <div className="grid gap-3">
        <Checkbox label="Track changes" defaultChecked />
        <Checkbox label="Suggest edits" />
        {/* indeterminate is a property, not an attribute, so it is set on the node. */}
        <Checkbox
          label="Some sections only"
          ref={(node) => {
            if (node) node.indeterminate = true;
          }}
        />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled and checked" disabled defaultChecked />
      </div>
      <Separator />
      <div className="flex items-center gap-2 text-ui text-muted-foreground">
        <Checkbox aria-label="Select row" />
        Bare control, labelled by aria-label
      </div>
    </FormCard>
  );
}

function SwitchDemo(): ReactElement {
  const [autosave, setAutosave] = useState(true);
  return (
    <FormCard>
      <div className="grid gap-3">
        <Switch label="Autosave" checked={autosave} onCheckedChange={setAutosave} />
        <Switch label="Reduce transparency" />
        <Switch label="Disabled" disabled />
        <Switch label="Disabled and on" disabled defaultChecked />
      </div>
      <p className="text-ui-sm text-muted-foreground">
        Autosave is {autosave ? 'on' : 'off'}. A switch takes effect immediately; use a checkbox
        when the choice only applies on submit.
      </p>
    </FormCard>
  );
}

function RadioGroupDemo(): ReactElement {
  const [paper, setPaper] = useState('a4');
  return (
    <FormCard>
      {/* A group is named by aria-labelledby; a <label> can only point at one control. */}
      <div className="grid gap-1.5">
        <p id="rg-paper" className="text-ui">
          Paper size, vertical
        </p>
        <RadioGroup value={paper} onValueChange={setPaper} aria-labelledby="rg-paper">
          <Radio value="a4" label="A4" />
          <Radio value="letter" label="US Letter" />
          <Radio value="legal" label="Legal" disabled />
        </RadioGroup>
      </div>
      <Separator />
      <div className="grid gap-1.5">
        <p id="rg-align" className="text-ui">
          Alignment, horizontal
        </p>
        <RadioGroup defaultValue="left" orientation="horizontal" aria-labelledby="rg-align">
          <Radio value="left" label="Left" />
          <Radio value="center" label="Center" />
          <Radio value="right" label="Right" />
        </RadioGroup>
      </div>
      <p className="text-ui-sm text-muted-foreground">
        Arrows move between the radios; the group is one Tab stop. Selected: {paper}.
      </p>
    </FormCard>
  );
}

function LabelDemo(): ReactElement {
  return (
    <FormCard>
      <div className="grid gap-1.5">
        <Label htmlFor="lb-name">Associated with htmlFor</Label>
        <Input id="lb-name" placeholder="Ada Lovelace" />
      </div>
      <div className="grid gap-1.5">
        {/* Nesting associates the two without an id. */}
        <Label>
          Associated by nesting
          <Input className="mt-1.5" placeholder="No id needed" />
        </Label>
      </div>
      <p className="text-ui-sm text-muted-foreground">
        Prefer Field, which does this and adds the description and error text below.
      </p>
    </FormCard>
  );
}

function FieldDemo(): ReactElement {
  return (
    <FormCard>
      <Field label="With a description" htmlFor="fd-desc" description="Shown in the window title bar.">
        <Input id="fd-desc" defaultValue="Q3 planning" />
      </Field>
      <Field
        label="Required, with an error"
        htmlFor="fd-err"
        description="This description is hidden while the error is set."
        error="Keep it under 280 characters."
        required
      >
        <Textarea id="fd-err" aria-invalid="true" required defaultValue="Slightly too long." />
      </Field>
      <Field label="Label only" htmlFor="fd-plain">
        <Select id="fd-plain" defaultValue="a4">
          <option value="a4">A4</option>
          <option value="letter">US Letter</option>
        </Select>
      </Field>
    </FormCard>
  );
}

function TooltipDemo(): ReactElement {
  return (
    <Frame>
      {/* Three controls a few pixels apart: the arrow is what says which one the label is for. */}
      <Glass className="flex gap-0.5 p-1">
        <Tooltip content="Bold ⌘B">
          <Button size="icon" variant="ghost" aria-label="Bold" className="font-semibold">
            B
          </Button>
        </Tooltip>
        <Tooltip content="Italic ⌘I">
          <Button size="icon" variant="ghost" aria-label="Italic" className="italic">
            I
          </Button>
        </Tooltip>
        <Tooltip content="Underline ⌘U">
          <Button size="icon" variant="ghost" aria-label="Underline" className="underline">
            U
          </Button>
        </Tooltip>
      </Glass>
      <Tooltip content="Tooltips repeat the label" side="bottom">
        <Button size="icon" aria-label="Help">
          ?
        </Button>
      </Tooltip>
      <Tooltip content="On the right" side="right">
        <Button size="icon" aria-label="Details">
          i
        </Button>
      </Tooltip>
    </Frame>
  );
}

function HoverCardDemo(): ReactElement {
  return (
    <Frame tall>
      {/* The card renders next to its trigger, so the line around it is a div: a <p>
          would be closed by the card and split the sentence in two. */}
      <div className="text-ui text-muted-foreground">
        Built by{' '}
        <HoverCard>
          <HoverCardTrigger className="rounded-xs underline decoration-dotted underline-offset-4 outline-none focus-visible:focus-outline">
            @crumza
          </HoverCardTrigger>
          <HoverCardContent align="start" className="grid gap-2">
            <strong className="text-foreground">Crumza UI</strong>
            <p className="text-muted-foreground">
              Tailwind-first React components with solid, frosted and liquid materials.
            </p>
            <a href="/docs/getting-started" className="underline underline-offset-4">
              Read the docs
            </a>
          </HoverCardContent>
        </HoverCard>
        , in the open.
      </div>
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

function DrawerDemo(): ReactElement {
  const [side, setSide] = useState<DrawerSide>('right');
  return (
    <Frame tall>
      <div className="grid justify-items-center gap-4">
        <SegmentedControl
          value={side}
          onValueChange={(value) => setSide(value as DrawerSide)}
          aria-label="Drawer side"
        >
          <Segment value="left">Left</Segment>
          <Segment value="right">Right</Segment>
        </SegmentedControl>
        <Drawer>
          <DrawerTrigger render={<Button />}>Filters</DrawerTrigger>
          <DrawerContent side={side} className="grid content-start gap-4">
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Narrow the results without leaving the page. Escape closes the drawer and returns
              focus to the button that opened it.
            </DrawerDescription>
            <Field label="Search" htmlFor="drawer-search">
              <Input id="drawer-search" placeholder="Anything" />
            </Field>
            <Checkbox label="In stock" defaultChecked />
            <Checkbox label="On sale" />
            <div className="flex justify-end gap-2 pt-2">
              <DrawerClose render={<Button variant="bordered" />}>Done</DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
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

function SpinnerDemo(): ReactElement {
  return (
    <Frame>
      <span className="inline-flex items-center gap-2 text-ui-sm text-muted-foreground">
        <Spinner size="sm" /> Small
        <Spinner /> Medium
        <Spinner size="lg" /> Large
      </span>
      <Button disabled>
        <Spinner size="sm" />
        Saving
      </Button>
      <Button variant="bordered" disabled>
        <Spinner size="sm" />
        Checking
      </Button>
      <Spinner label="Standalone, announced" />
    </Frame>
  );
}

function SkeletonDemo(): ReactElement {
  const [loaded, setLoaded] = useState(false);
  return (
    <Frame>
      <Card className="w-full max-w-sm p-4">
        {loaded ? (
          <div className="flex gap-3">
            <div className="size-10 flex-none rounded-full bg-primary/15" />
            <div className="grid flex-1 gap-1 text-ui-sm">
              <span className="text-foreground">Q3 planning</span>
              <span className="text-muted-foreground">
                Twelve pages, last edited by you four minutes ago. Shared with the design team.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex gap-3" aria-busy="true">
            <Skeleton shape="circle" className="size-10 flex-none" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton shape="text" lines={2} />
            </div>
          </div>
        )}
      </Card>
      <Button variant="secondary" size="sm" onClick={() => setLoaded((on) => !on)}>
        {loaded ? 'Show the skeleton' : 'Load the content'}
      </Button>
    </Frame>
  );
}

/**
 * The liquix stage is fixed to the window and takes the page scroll for its
 * backdrop, so its example is a window of its own rather than a box in the
 * article. The frame runs the real component, shader and all, and each page
 * shows the shape it documents.
 */
function LiquixFrame({
  shape,
  frosted,
  title,
}: {
  shape?: string;
  frosted?: boolean;
  title: string;
}): ReactElement {
  const query = new URLSearchParams();
  if (shape) query.set('shape', shape);
  if (frosted) query.set('frosted', '');
  const search = query.toString().replace(/=(&|$)/g, '$1');
  return (
    <div className="demo-embed">
      <iframe src={search ? `/demos/liquix?${search}` : '/demos/liquix'} title={title} loading="lazy" />
      <p>
        Hover or press the shape, and scroll inside the frame to move the backdrop behind the glass.
        {frosted ? ' The switch in the corner toggles the material.' : ''} Needs WebGL2; without it
        the shape falls back to CSS.
      </p>
    </div>
  );
}

function LiquixStageDemo(): ReactElement {
  return <LiquixFrame title="A liquix stage holding two shapes over a scrolling backdrop" />;
}

function LiquixCapsuleDemo(): ReactElement {
  return <LiquixFrame shape="capsule" title="A liquix capsule over a scrolling backdrop" />;
}

function LiquixCircleDemo(): ReactElement {
  return <LiquixFrame shape="circle" title="A liquix circle over a scrolling backdrop" />;
}

function LiquixFrostedDemo(): ReactElement {
  return <LiquixFrame frosted title="Two liquix shapes in the frosted material over a scrolling backdrop" />;
}

/* Liquid glass: every demo is one component on a refracting stage, with the five knobs above. */
function LiquidHeaderDemo(): ReactElement {
  return <LiquidFrame>{(r) => <LiquidHeader radius={r} />}</LiquidFrame>;
}
function LiquidPricingCardDemo(): ReactElement {
  return <LiquidFrame height={520}>{(r) => <LiquidPricingCard radius={r} />}</LiquidFrame>;
}
function LiquidTestimonialsDemo(): ReactElement {
  return <LiquidFrame height={480}>{(r) => <LiquidTestimonials radius={r} />}</LiquidFrame>;
}
function LiquidMobileNavDemo(): ReactElement {
  return <LiquidFrame height={460}>{(r) => <LiquidMobileNav radius={r} />}</LiquidFrame>;
}
function LiquidTabIndicatorDemo(): ReactElement {
  return <LiquidFrame height={360}>{(r) => <LiquidTabIndicator radius={r} />}</LiquidFrame>;
}
function LiquidSearchDemo(): ReactElement {
  return <LiquidFrame>{(r) => <LiquidSearch radius={r} />}</LiquidFrame>;
}
function LiquidStepperDemo(): ReactElement {
  return <LiquidFrame height={320}>{(r) => <LiquidStepper radius={r} />}</LiquidFrame>;
}
function LiquidColorPickerDemo(): ReactElement {
  return <LiquidFrame height={480}>{(r) => <LiquidColorPicker radius={r} />}</LiquidFrame>;
}
function LiquidNotificationStackDemo(): ReactElement {
  return <LiquidFrame height={480}>{(r) => <LiquidNotificationStack radius={r} />}</LiquidFrame>;
}
function LiquidContextMenuDemo(): ReactElement {
  return <LiquidFrame>{(r) => <LiquidContextMenu radius={r} />}</LiquidFrame>;
}
function LiquidGalleryDemo(): ReactElement {
  return (
    <LiquidFrame>{(r) => <LiquidGallery radius={r} images={liquidGalleryImages} />}</LiquidFrame>
  );
}

/** Which live demo sits above which docs page. Slugs match the docs/ file paths. */
const demos: Record<string, ComponentType> = {
  'components/button': ButtonDemo,
  'components/glass': GlassDemo,
  'components/lens': LensDemo,
  'components/liquix-stage': LiquixStageDemo,
  'components/liquix-capsule': LiquixCapsuleDemo,
  'components/liquix-circle': LiquixCircleDemo,
  'components/liquix-surface': LiquixTabsDemo,
  'components/liquix-tabs': LiquixTabsDemo,
  'components/liquix-segmented-control': LiquixSegmentedDemo,
  'components/liquix-button': LiquixButtonDemo,
  'components/liquix-field': LiquixFieldDemo,
  'components/liquix-switch': LiquixSwitchDemo,
  'components/liquix-menu': LiquixMenuDemo,
  'components/liquix-popover': LiquixPopoverDemo,
  'components/liquix-toast': LiquixToastDemo,
  'components/liquix-frosted': LiquixFrostedDemo,
  'components/card': CardDemo,
  'components/toolbar': ToolbarDemo,
  'components/tabs': TabsDemo,
  'components/accordion': AccordionDemo,
  'components/toggle': ToggleDemo,
  'components/segmented-control': SegmentedDemo,
  'components/input': InputDemo,
  'components/textarea': TextareaDemo,
  'components/select': SelectDemo,
  'components/slider': SliderDemo,
  'components/checkbox': CheckboxDemo,
  'components/switch': SwitchDemo,
  'components/radio-group': RadioGroupDemo,
  'components/label': LabelDemo,
  'components/field': FieldDemo,
  'components/date-time-picker': DateTimePickerDemo,
  'components/time-picker': TimePickerDemo,
  'components/tooltip': TooltipDemo,
  'components/hover-card': HoverCardDemo,
  'components/popover': PopoverDemo,
  'components/dialog': DialogDemo,
  'components/drawer': DrawerDemo,
  'components/menu': MenuDemo,
  'components/toast': ToastDemo,
  'components/badge': FactsDemo,
  'components/kbd': FactsDemo,
  'components/progress': FactsDemo,
  'components/spinner': SpinnerDemo,
  'components/skeleton': SkeletonDemo,
  'components/separator': FactsDemo,
  material: GlassDemo,
  liquid: LiquidHeaderDemo,
  'components/liquid-pricing-card': LiquidPricingCardDemo,
  'components/liquid-testimonials': LiquidTestimonialsDemo,
  'components/liquid-header': LiquidHeaderDemo,
  'components/liquid-mobile-nav': LiquidMobileNavDemo,
  'components/liquid-tab-indicator': LiquidTabIndicatorDemo,
  'components/liquid-search': LiquidSearchDemo,
  'components/liquid-stepper': LiquidStepperDemo,
  'components/liquid-color-picker': LiquidColorPickerDemo,
  'components/liquid-notification-stack': LiquidNotificationStackDemo,
  'components/liquid-context-menu': LiquidContextMenuDemo,
  'components/liquid-gallery': LiquidGalleryDemo,
};

export function hasDemo(slug: string): boolean {
  return slug in demos;
}

/** One statically imported island; Astro cannot hydrate a component picked from a map. */
export function Demos({ slug }: { readonly slug: string }): ReactElement | null {
  const Demo = demos[slug];
  return Demo ? <Demo /> : null;
}
