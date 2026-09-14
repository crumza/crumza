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
  Toggle,
  Toaster,
  Toolbar,
  Tooltip,
  toast,
} from '@crumza/ui/web';
import { type ReactElement, type ReactNode, useEffect, useState } from 'react';
import { LensDemo } from './LensDemo';

type Theme = 'system' | 'light' | 'dark';
type Density = 'compact' | 'comfortable';

/** Chrome samples the pointer for the press glow. ~6 lines, no per-frame work. */
function trackGlow(): () => void {
  const onMove = (e: PointerEvent): void => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.glass-interactive');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--glass-glow-x', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--glass-glow-y', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  return () => document.removeEventListener('pointermove', onMove);
}

export function App(): ReactElement {
  const [theme, setTheme] = useState<Theme>('system');
  const [density, setDensity] = useState<Density>('compact');
  const [intensity, setIntensity] = useState(0.25);
  const [brand, setBrand] = useState('#3d7bf5');
  const [reduce, setReduce] = useState(false);
  const [align, setAlign] = useState('left');
  const [zoom, setZoom] = useState(100);

  useEffect(trackGlow, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.dataset['theme'] = theme;
    root.dataset['density'] = density;
    if (reduce) root.dataset['transparency'] = 'reduce';
    else root.removeAttribute('data-transparency');
    root.style.setProperty('--glass-intensity', String(intensity));
    root.style.setProperty('--primary', brand);
  }, [theme, density, intensity, brand, reduce]);

  return (
    <main className="relative min-h-dvh overflow-clip">
      <Backdrop />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 p-8">
        {/* A toolbar the Apple way: the bar is air, the groups are glass, the controls are fills. */}
        <Toolbar aria-label="Formatting" className="gap-3">
          <Glass className="flex gap-0.5 p-1">
            <Menu>
              <MenuTrigger render={<Button size="sm" variant="ghost" shape="rect" />}>
                File
              </MenuTrigger>
              <MenuContent>
                <MenuItem shortcut="⌘N">New document</MenuItem>
                <MenuItem shortcut="⌘O">Open...</MenuItem>
                <MenuItem shortcut="⌘S">Save</MenuItem>
                <MenuItem disabled>Revert</MenuItem>
                <MenuSeparator />
                <MenuLabel>View</MenuLabel>
                <MenuCheckboxItem defaultChecked shortcut="⌘R">
                  Ruler
                </MenuCheckboxItem>
                <MenuCheckboxItem>Word count</MenuCheckboxItem>
                <MenuSeparator />
                <MenuRadioGroup defaultValue="page">
                  <MenuRadioItem value="page">Page layout</MenuRadioItem>
                  <MenuRadioItem value="draft">Draft</MenuRadioItem>
                  <MenuRadioItem value="focus">Focus</MenuRadioItem>
                </MenuRadioGroup>
              </MenuContent>
            </Menu>
            <Button size="sm" variant="ghost" shape="rect">
              Undo
            </Button>
            <Button size="sm" variant="ghost" shape="rect">
              Redo
            </Button>
          </Glass>
          <Glass className="flex gap-0.5 p-1">
            <Tooltip content="Bold ⌘B">
              <Toggle size="sm" defaultPressed aria-label="Bold" className="font-semibold">
                B
              </Toggle>
            </Tooltip>
            <Tooltip content="Italic ⌘I">
              <Toggle size="sm" aria-label="Italic" className="italic">
                I
              </Toggle>
            </Tooltip>
            <Tooltip content="Underline ⌘U">
              <Toggle size="sm" aria-label="Underline" className="underline">
                U
              </Toggle>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1" />
            <SegmentedControl
              value={align}
              onValueChange={setAlign}
              aria-label="Alignment"
              className="h-auto"
            >
              <Segment value="left">Left</Segment>
              <Segment value="center">Center</Segment>
              <Segment value="right">Right</Segment>
            </SegmentedControl>
          </Glass>
          <span className="flex-1" />
          <Glass className="flex gap-0.5 p-1">
            <Button size="sm" variant="ghost" shape="rect">
              Comments
              <Badge variant="accent">3</Badge>
            </Button>
          </Glass>
          <Button size="sm" variant="primary">
            Share
          </Button>
        </Toolbar>

        <Row label="glass, floating over content">
          <Button size="sm">Small</Button>
          <Button>Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            +
          </Button>
          <Button shape="rect">Rect</Button>
          <Button disabled>Disabled</Button>
        </Row>

        <LensDemo />

        <Row label="overlays: engine-native popover and dialog">
          <Popover>
            <PopoverTrigger render={<Button />}>Page setup</PopoverTrigger>
            <PopoverContent className="grid gap-3" align="start">
              <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
                margins
              </span>
              <Field label="Top" htmlFor="m-top">
                <Input id="m-top" size="sm" defaultValue="2.54 cm" />
              </Field>
              <Field label="Bottom" htmlFor="m-bottom">
                <Input id="m-bottom" size="sm" defaultValue="2.54 cm" />
              </Field>
              <Checkbox label="Mirror margins" />
            </PopoverContent>
          </Popover>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" />}>Delete document</DialogTrigger>
            <DialogContent className="grid gap-4">
              <DialogTitle>Delete "Q3 planning"?</DialogTitle>
              <DialogDescription>
                This removes the document and its 14 comments for everyone. There is no undo.
              </DialogDescription>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="ghost" shape="rect" />}>Cancel</DialogClose>
                <DialogClose render={<Button variant="destructive" shape="rect" />}>
                  Delete
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
          <Tooltip content="Tooltips repeat the label">
            <Button size="icon" aria-label="Help">
              ?
            </Button>
          </Tooltip>
        </Row>

        <div className="grid gap-6 md:grid-cols-2">
          <Glass className="grid gap-5 p-6">
            <div className="grid gap-1">
              <h1 className="text-2xl tracking-[-0.02em]">Crumza</h1>
              <p className="text-muted-foreground">
                A pane of glass over an opaque document. Chrome is glass; content never is.
              </p>
            </div>
            <Row label="primary, the one accent per view">
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary">Medium</Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
            </Row>
            <Row label="fills for surfaces">
              <Button>Glass becomes fill</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
              <Button variant="link">Link</Button>
            </Row>
            <Tabs defaultValue="style">
              <TabList aria-label="Inspector">
                <Tab value="style">Style</Tab>
                <Tab value="layout">Layout</Tab>
                <Tab value="export" disabled>
                  Export
                </Tab>
              </TabList>
              <TabPanel value="style" className="text-ui text-muted-foreground">
                Paragraph styles, fonts and colors would live here.
              </TabPanel>
              <TabPanel value="layout" className="text-ui text-muted-foreground">
                Margins, columns and page size.
              </TabPanel>
              <TabPanel value="export" />
            </Tabs>
            <Row label="facts">
              <Badge variant="accent">New</Badge>
              <Badge>Draft</Badge>
              <Badge variant="outline">v0.1</Badge>
              <Badge variant="destructive">Failing</Badge>
              <span className="inline-flex items-center gap-1 text-ui-sm text-muted-foreground">
                Command palette <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </Row>
          </Glass>

          <Card className="grid gap-4 p-6">
            <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
              card, opaque: forms live here
            </span>
            <Field
              label="Document title"
              htmlFor="title"
              description="Shown in the window title bar."
            >
              <Input id="title" placeholder="Untitled" defaultValue="Q3 planning" />
            </Field>
            <Field label="Summary" htmlFor="summary" error="Keep it under 280 characters." required>
              <Textarea
                id="summary"
                aria-invalid="true"
                defaultValue="A short abstract that is slightly too long for the field, apparently."
              />
            </Field>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Checkbox label="Track changes" defaultChecked />
              <Checkbox label="Disabled" disabled />
              <Switch label="Autosave" defaultChecked />
            </div>
            <RadioGroup defaultValue="a4" orientation="horizontal" aria-label="Paper size">
              <Radio value="a4" label="A4" />
              <Radio value="letter" label="Letter" />
              <Radio value="legal" label="Legal" disabled />
            </RadioGroup>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" shape="rect">
                Cancel
              </Button>
              <Button variant="primary" shape="rect">
                Save
              </Button>
            </div>
          </Card>
        </div>

        <Card className="grid gap-4 p-6">
          <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
            select, slider, progress, toast
          </span>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Paper" htmlFor="paper">
              <Select id="paper" defaultValue="a4">
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="legal">Legal</option>
              </Select>
            </Field>
            <Field label={`Zoom ${zoom}%`} htmlFor="zoom">
              <Slider id="zoom" min={50} max={200} step={10} value={zoom} onValueChange={setZoom} />
            </Field>
            <Field label="Exporting">
              <div className="grid gap-3 pt-2">
                <Progress value={zoom / 2} aria-label="Export progress" />
                <Progress aria-label="Indexing" />
              </div>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              shape="rect"
              onClick={() =>
                toast('Document saved', { description: 'Q3 planning, 2 seconds ago.' })
              }
            >
              Toast
            </Button>
            <Button
              variant="secondary"
              shape="rect"
              onClick={() =>
                toast.success('Exported to PDF', {
                  action: { label: 'Open', onClick: () => undefined },
                })
              }
            >
              Success with action
            </Button>
            <Button
              variant="secondary"
              shape="rect"
              onClick={() =>
                toast.error('Export failed', {
                  description: 'The file is open in another app.',
                  duration: 0,
                })
              }
            >
              Error, sticky
            </Button>
          </div>
        </Card>

        <Glass className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 text-ui">
          <label className="flex items-center gap-2">
            theme
            <select
              className="field h-(--control-sm) px-2"
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
            >
              <option value="system">system</option>
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            density
            <select
              className="field h-(--control-sm) px-2"
              value={density}
              onChange={(e) => setDensity(e.target.value as Density)}
            >
              <option value="compact">compact</option>
              <option value="comfortable">comfortable</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            intensity {intensity.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
          </label>
          <label className="flex items-center gap-2">
            brand
            <input type="color" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
          <Switch
            label="reduce transparency"
            checked={reduce}
            onChange={(e) => setReduce(e.target.checked)}
          />
        </Glass>
      </div>
      <Toaster />
    </main>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div className="grid gap-2">
      <span className="font-mono text-ui-sm uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** Something worth looking through: saturated blobs, a stripe, and body text. */
function Backdrop(): ReactElement {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute -top-24 -left-24 size-[42rem] rounded-full bg-[oklch(0.75_0.2_35)] opacity-70 blur-3xl" />
      <div className="absolute top-32 right-[-10rem] size-[36rem] rounded-full bg-[oklch(0.7_0.2_300)] opacity-70 blur-3xl" />
      <div className="absolute bottom-[-12rem] left-1/3 size-[40rem] rounded-full bg-[oklch(0.8_0.17_160)] opacity-70 blur-3xl" />
      <div className="absolute top-[19rem] right-0 left-0 h-24 bg-[repeating-linear-gradient(90deg,oklch(0.2_0_0)_0_24px,transparent_24px_48px)] opacity-60" />
      <p className="absolute top-[27rem] left-12 max-w-md text-4xl leading-tight text-foreground/80">
        Content lives here, in the layer below the glass, and scrolls under the chrome.
      </p>
    </div>
  );
}
