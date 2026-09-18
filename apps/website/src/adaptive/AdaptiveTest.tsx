import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Radio,
  RadioGroup,
  Segment,
  SegmentedControl,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Theme,
  Toggle,
  Toolbar,
} from './ui';
import { type CSSProperties, type ReactElement, type ReactNode, useEffect, useId, useState } from 'react';
import {
  AdaptiveGlass,
  adaptiveGlass,
  type AdaptiveGlassOptions,
  type GlassScale,
  type GlassVariant,
  GlassBackground,
  useGlassBackground,
} from '../../../../packages/ui/src/web/adaptive';

/* /test: the adaptive material under inspection.

   The same controls over three backdrops, in either appearance, with every
   public knob of the material exposed. The readouts under each backdrop are
   read from the computed style of the specimen, so what is printed is what
   the CSS decided, not what this page thinks it should be. */

type Scheme = 'light' | 'dark';

interface Knobs {
  readonly variant: GlassVariant;
  readonly scale: GlassScale;
  readonly tint: string | undefined;
  readonly glint: boolean;
  readonly frosted: boolean;
  readonly intensity: number;
  readonly reduceTransparency: boolean;
  readonly reduceMotion: boolean;
  readonly moreContrast: boolean;
}

const DEFAULT_KNOBS: Knobs = {
  variant: 'regular',
  scale: 'small',
  tint: undefined,
  glint: true,
  frosted: false,
  intensity: 0.5,
  reduceTransparency: false,
  reduceMotion: false,
  moreContrast: false,
};

/** The five material knobs, and nothing else, for a surface. */
function material(knobs: Knobs, scale?: GlassScale): AdaptiveGlassOptions {
  return {
    variant: knobs.variant,
    tint: knobs.tint,
    glint: knobs.glint,
    frosted: knobs.frosted,
    ...(scale ? { scale } : {}),
  };
}

const TINTS: readonly { readonly label: string; readonly value: string | undefined }[] = [
  { label: 'None', value: undefined },
  { label: 'Blue', value: 'oklch(0.62 0.19 255)' },
  { label: 'Brand green', value: '#245c46' },
  { label: 'Rose', value: 'oklch(0.66 0.2 10)' },
  { label: 'Amber', value: 'oklch(0.82 0.15 78)' },
];

interface Backdrop {
  readonly id: string;
  readonly label: string;
  readonly note: string;
  readonly background?: string;
  readonly image?: string;
}

const BACKDROPS: readonly Backdrop[] = [
  {
    id: 'light',
    label: 'Light background',
    note: 'Bright content. Small glass takes a dark ink and a smoked face.',
    background: 'linear-gradient(135deg, #fbfbf9 0%, #eceee9 55%, #dfe4ea 100%)',
  },
  {
    id: 'dark',
    label: 'Dark background',
    note: 'Dark content. Small glass takes a light ink and a milky face.',
    background: 'linear-gradient(135deg, #15181d 0%, #1f2530 55%, #0f1216 100%)',
  },
  {
    id: 'image',
    label: 'Image background',
    note: 'Sampled once on load. Clear glass keeps the picture and veils it when bright.',
    image: '/liquid/bloom.png',
  },
];

/* theme, shared with the site header's toggle */

function readScheme(): Scheme {
  return document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
}

function useScheme(): [Scheme, (next: Scheme) => void] {
  const [scheme, setScheme] = useState<Scheme>('light');
  useEffect(() => {
    setScheme(readScheme());
    const observer = new MutationObserver(() => setScheme(readScheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  const set = (next: Scheme): void => {
    document.documentElement.dataset['theme'] = next;
    try {
      localStorage.setItem('crumza-theme', next);
    } catch {
      /* Private mode: the choice lasts for the page. */
    }
    document.querySelector('#theme-toggle')?.setAttribute('aria-pressed', String(next === 'dark'));
  };
  return [scheme, set];
}

/* readout: what the CSS decided for one element */

interface Reading {
  readonly polarity: number;
  readonly face: number;
  readonly separation: number;
  readonly dimming: number;
  readonly ink: string;
  readonly alpha: string;
}

function readGlass(element: Element): Reading {
  const style = getComputedStyle(element);
  const num = (name: string): number => Number.parseFloat(style.getPropertyValue(name)) || 0;
  const polarity = num('--glass-ink-polarity');
  return {
    polarity,
    face: num('--glass-surface-luminance'),
    separation: num('--glass-separation'),
    dimming: num('--glass-dimming'),
    ink: polarity > 0.5 ? 'dark' : 'light',
    alpha: style.getPropertyValue('--_alpha').trim(),
  };
}

function Readout({
  target,
  revision,
}: {
  readonly target: string;
  readonly revision: string;
}): ReactElement {
  const context = useGlassBackground();
  const [reading, setReading] = useState<Reading | undefined>(undefined);
  useEffect(() => {
    const host = context?.ref.current;
    if (!host) return;
    const read = (): void => {
      const element = host.querySelector(target);
      if (element) setReading(readGlass(element));
    };
    read();
    // Once more after the material's transition has settled.
    const later = window.setTimeout(read, 320);
    return () => window.clearTimeout(later);
  }, [context, target, revision]);
  const backdrop = context?.luminance;
  return (
    <dl className="test-readout">
      <div>
        <dt>Backdrop</dt>
        <dd>{backdrop === undefined ? 'theme' : backdrop.toFixed(2)}</dd>
      </div>
      <div>
        <dt>Face</dt>
        <dd>{reading ? reading.face.toFixed(2) : '–'}</dd>
      </div>
      <div>
        <dt>Ink</dt>
        <dd>{reading ? reading.ink : '–'}</dd>
      </div>
      <div>
        <dt>Separation</dt>
        <dd>{reading ? reading.separation.toFixed(2) : '–'}</dd>
      </div>
      <div>
        <dt>Dimming</dt>
        <dd>{reading ? reading.dimming.toFixed(2) : '–'}</dd>
      </div>
    </dl>
  );
}

/* specimens, one per scale */

function SmallSpecimen({ knobs }: { readonly knobs: Knobs }): ReactElement {
  const glass = adaptiveGlass(material(knobs, 'small'));
  return (
    <Toolbar aria-label="Small controls" className="test-specimen test-toolbar">
      <Button {...glass} size="sm" data-glass-specimen="">
        Back
      </Button>
      <Button {...glass}>Share</Button>
      <Button {...glass} size="icon" aria-label="Favourite">
        ★
      </Button>
      <Menu>
        <MenuTrigger render={<Button {...glass} />}>More</MenuTrigger>
        <MenuContent {...adaptiveGlass(material(knobs, 'medium'))}>
          <MenuItem shortcut="⌘D">Duplicate</MenuItem>
          <MenuItem shortcut="⌘R">Rename</MenuItem>
          <MenuSeparator />
          <MenuItem>Move to…</MenuItem>
        </MenuContent>
      </Menu>
      <Button {...glass} tone="primary">
        Continue
      </Button>
    </Toolbar>
  );
}

function MediumSpecimen({ knobs }: { readonly knobs: Knobs }): ReactElement {
  const id = useId();
  const [paper, setPaper] = useState('a4');
  return (
    <AdaptiveGlass {...material(knobs, 'medium')} className="test-specimen test-card" data-glass-specimen="">
      <div className="test-card-head">
        <p className="test-title">Export</p>
        <p className="test-muted">Medium surfaces adapt, but hold their hierarchy.</p>
      </div>
      <Field label="File name" htmlFor={`${id}-name`}>
        <Input id={`${id}-name`} defaultValue="Quarterly review" />
      </Field>
      <div className="test-row">
        <Checkbox label="Include comments" defaultChecked />
        <Switch label="Compress" />
      </div>
      <RadioGroup value={paper} onValueChange={setPaper} orientation="horizontal" aria-label="Paper">
        <Radio value="a4" label="A4" />
        <Radio value="letter" label="Letter" />
      </RadioGroup>
      <Tabs defaultValue="pdf">
        <TabList aria-label="Format">
          <Tab value="pdf">PDF</Tab>
          <Tab value="png">PNG</Tab>
          <Tab value="svg">SVG</Tab>
        </TabList>
        <TabPanel value="pdf" className="test-muted">
          Vector, with the fonts embedded.
        </TabPanel>
        <TabPanel value="png" className="test-muted">
          Raster at 2x.
        </TabPanel>
        <TabPanel value="svg" className="test-muted">
          Vector, editable.
        </TabPanel>
      </Tabs>
      <div className="test-row test-row-end">
        <Button variant="ghost">Cancel</Button>
        <Dialog>
          <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
          <DialogContent {...adaptiveGlass(material(knobs, 'medium'))} className="test-dialog">
            <DialogTitle>Replace the existing file?</DialogTitle>
            <DialogDescription>
              A dialog is centred on the window, so it reads the theme rather than the region that
              opened it.
            </DialogDescription>
            <div className="test-row test-row-end">
              <DialogClose render={<Button variant="ghost" />}>Keep both</DialogClose>
              <DialogClose render={<Button tone="primary" />}>Replace</DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdaptiveGlass>
  );
}

function LargeSpecimen({ knobs }: { readonly knobs: Knobs }): ReactElement {
  const [range, setRange] = useState('week');
  return (
    <AdaptiveGlass {...material(knobs, 'large')} className="test-specimen test-panel" data-glass-specimen="">
      <p className="test-title">Library</p>
      <nav aria-label="Library" className="test-nav">
        <Button variant="ghost" shape="rect" className="test-nav-item" aria-current="page">
          Inbox <Badge>12</Badge>
        </Button>
        <Button variant="ghost" shape="rect" className="test-nav-item">
          Drafts <Badge>3</Badge>
        </Button>
        <Button variant="ghost" shape="rect" className="test-nav-item">
          Archive
        </Button>
        <Button variant="ghost" shape="rect" className="test-nav-item">
          Trash
        </Button>
      </nav>
      <SegmentedControl value={range} onValueChange={setRange} aria-label="Range">
        <Segment value="day">Day</Segment>
        <Segment value="week">Week</Segment>
        <Segment value="month">Month</Segment>
      </SegmentedControl>
      <p className="test-muted">
        A large surface does not flip with its backdrop. When the content beneath disagrees with
        the theme, the pane gains body instead, and its ink stays where the theme put it.
      </p>
      <Toolbar aria-label="Panel actions" className="test-row">
        <Toggle size="sm" aria-label="Bold" defaultPressed>
          B
        </Toggle>
        <Toggle size="sm" aria-label="Italic">
          I
        </Toggle>
        <Popover>
          <PopoverTrigger render={<Button size="sm" />}>Filter</PopoverTrigger>
          <PopoverContent {...adaptiveGlass(material(knobs, 'medium'))}>
            <p className="test-muted">Popovers hang from their trigger and keep the context.</p>
          </PopoverContent>
        </Popover>
      </Toolbar>
    </AdaptiveGlass>
  );
}

function Specimen({ knobs }: { readonly knobs: Knobs }): ReactElement {
  if (knobs.scale === 'small') return <SmallSpecimen knobs={knobs} />;
  if (knobs.scale === 'medium') return <MediumSpecimen knobs={knobs} />;
  return <LargeSpecimen knobs={knobs} />;
}

/* the component sheet: every glass component, one row per backdrop */

function Sheet({ knobs }: { readonly knobs: Knobs }): ReactElement {
  const id = useId();
  const control = adaptiveGlass(material(knobs));
  const pane = adaptiveGlass(material(knobs, 'medium'));
  return (
    <div className="test-sheet">
      <Button {...control}>Button</Button>
      <Button {...control} variant="muted">
        Muted
      </Button>
      <Button {...control} variant="bordered">
        Bordered
      </Button>
      <Button {...control} tone="primary">
        Primary
      </Button>
      <Input aria-label="Input" placeholder="Input" className="test-sheet-input" />
      <Checkbox label="Checkbox" defaultChecked />
      <RadioGroup defaultValue="one" orientation="horizontal" aria-label="Radio">
        <Radio value="one" label="One" />
        <Radio value="two" label="Two" />
      </RadioGroup>
      <Switch label="Switch" defaultChecked />
      <Toggle aria-label="Toggle" defaultPressed>
        Toggle
      </Toggle>
      <Tabs defaultValue="a" className="test-sheet-tabs">
        <TabList aria-label="Tabs">
          <Tab value="a">Tabs</Tab>
          <Tab value="b">Two</Tab>
        </TabList>
        <TabPanel value="a" />
        <TabPanel value="b" />
      </Tabs>
      <Menu>
        <MenuTrigger render={<Button {...control} />}>Dropdown</MenuTrigger>
        <MenuContent {...pane}>
          <MenuItem>First</MenuItem>
          <MenuItem>Second</MenuItem>
        </MenuContent>
      </Menu>
      <Dialog>
        <DialogTrigger render={<Button {...control} />}>Dialog</DialogTrigger>
        <DialogContent {...pane} className="test-dialog">
          <DialogTitle>Dialog</DialogTitle>
          <DialogDescription>Reads the theme, in a medium pane.</DialogDescription>
          <div className="test-row test-row-end">
            <DialogClose render={<Button />}>Close</DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      <AdaptiveGlass {...material(knobs, 'medium')} className="test-sheet-card">
        <p className="test-title">Card</p>
        <p className="test-muted">Medium pane with a nested control.</p>
        <div className="test-row">
          <Button size="sm">Nested</Button>
          <Button size="sm" tone="primary">
            Primary
          </Button>
        </div>
      </AdaptiveGlass>
      <Toolbar aria-label={`Toolbar ${id}`} className="test-sheet-toolbar">
        <AdaptiveGlass {...material(knobs, 'small')} className="test-toolbar-group">
          <Button size="sm" variant="ghost" shape="rect">
            Undo
          </Button>
          <Button size="sm" variant="ghost" shape="rect">
            Redo
          </Button>
        </AdaptiveGlass>
      </Toolbar>
    </div>
  );
}

/* region sampling over one picture */

function SampledPill({ children, style }: { readonly children: ReactNode; readonly style: CSSProperties }): ReactElement {
  return (
    <AdaptiveGlass sample scale="small" className="test-pill" style={style}>
      {children}
    </AdaptiveGlass>
  );
}

/* controls */

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly onChange: (value: T) => void;
}): ReactElement {
  return (
    <div className="test-control">
      <span>{label}</span>
      <SegmentedControl value={value} onValueChange={(v) => onChange(v as T)} aria-label={label}>
        {options.map((option) => (
          <Segment key={option.value} value={option.value}>
            {option.label}
          </Segment>
        ))}
      </SegmentedControl>
    </div>
  );
}

export function AdaptiveTest(): ReactElement {
  const [scheme, setScheme] = useScheme();
  const [knobs, setKnobs] = useState<Knobs>(DEFAULT_KNOBS);
  const set = <K extends keyof Knobs>(key: K, value: Knobs[K]): void =>
    setKnobs((current) => ({ ...current, [key]: value }));
  const revision = JSON.stringify({ knobs, scheme });
  const tintId = useId();
  const clarityId = useId();
  const wrapperStyle = {
    '--glass-intensity': knobs.intensity,
    ...(knobs.reduceMotion ? { '--motion-scale': 0 } : {}),
  } as CSSProperties;

  return (
    <Theme
      reducedTransparency={knobs.reduceTransparency}
      data-contrast={knobs.moreContrast ? 'more' : undefined}
      className="test-root"
      style={wrapperStyle}
    >
      <section className="test-controls" aria-label="Material controls">
        <Choice
          label="Appearance"
          value={scheme}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={setScheme}
        />
        <Choice
          label="Variant"
          value={knobs.variant}
          options={[
            { value: 'regular', label: 'Regular' },
            { value: 'clear', label: 'Clear' },
          ]}
          onChange={(variant) => set('variant', variant)}
        />
        <Choice
          label="Scale"
          value={knobs.scale}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
          onChange={(scale) => set('scale', scale)}
        />
        <label className="test-control" htmlFor={tintId}>
          <span>Tint</span>
          <select
            id={tintId}
            value={knobs.tint ?? ''}
            onChange={(event) => set('tint', event.target.value || undefined)}
          >
            {TINTS.map((tint) => (
              <option key={tint.label} value={tint.value ?? ''}>
                {tint.label}
              </option>
            ))}
          </select>
        </label>
        <label className="test-control" htmlFor={clarityId}>
          <span>Clarity</span>
          <input
            id={clarityId}
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={knobs.intensity}
            onChange={(event) => set('intensity', Number(event.target.value))}
          />
          <output>{Math.round(knobs.intensity * 100)}%</output>
        </label>
        <div className="test-switches">
          <Switch label="Glint" checked={knobs.glint} onCheckedChange={(v) => set('glint', v)} />
          <Switch label="Frosted" checked={knobs.frosted} onCheckedChange={(v) => set('frosted', v)} />
          <Switch
            label="Reduce transparency"
            checked={knobs.reduceTransparency}
            onCheckedChange={(v) => set('reduceTransparency', v)}
          />
          <Switch
            label="More contrast"
            checked={knobs.moreContrast}
            onCheckedChange={(v) => set('moreContrast', v)}
          />
          <Switch
            label="Reduce motion"
            checked={knobs.reduceMotion}
            onCheckedChange={(v) => set('reduceMotion', v)}
          />
        </div>
      </section>

      <section className="test-section">
        <h2>Adaptive liquid glass</h2>
        <p className="test-lede">
          One material over three backdrops. Switch the appearance and the backdrops stay put, so
          you can see the glass answer the content rather than the theme. The readouts are the
          computed values on the specimen.
        </p>
        <div className="test-grid">
          {BACKDROPS.map((backdrop) => (
            <GlassBackground
              key={backdrop.id}
              className="test-backdrop"
              {...(backdrop.background ? { background: backdrop.background } : {})}
              {...(backdrop.image ? { image: backdrop.image } : {})}
            >
              <div className="test-backdrop-label">
                <span>{backdrop.label}</span>
              </div>
              <div className="test-stage" data-scale={knobs.scale}>
                <Specimen knobs={knobs} />
              </div>
              <div className="test-backdrop-foot">
                <Readout target="[data-glass-specimen]" revision={revision} />
                <p className="test-note">{backdrop.note}</p>
              </div>
            </GlassBackground>
          ))}
        </div>
      </section>

      <section className="test-section">
        <h2>Region sampling</h2>
        <p className="test-lede">
          The same picture, read under each pill's own box once per layout. Two small controls on
          one image can land in opposite polarities. No screen is read, and nothing runs per frame.
        </p>
        <GlassBackground image="/liquid/ridge.jpg" className="test-backdrop test-sampling">
          <SampledPill style={{ top: 22, left: 22 }}>Top left</SampledPill>
          <SampledPill style={{ top: 22, right: 22 }}>Top right</SampledPill>
          <SampledPill style={{ bottom: 22, left: 22 }}>Bottom left</SampledPill>
          <SampledPill style={{ bottom: 22, right: 22 }}>Bottom right</SampledPill>
        </GlassBackground>
      </section>

      <section className="test-section">
        <h2>Every component, every backdrop</h2>
        <p className="test-lede">
          Controls without a scale attribute default to small; panes default to medium. Content
          placed directly on a backdrop reads it too, so labels and switches follow without wrappers.
        </p>
        <div className="test-rows">
          {BACKDROPS.map((backdrop) => (
            <GlassBackground
              key={backdrop.id}
              className="test-backdrop test-backdrop-row"
              {...(backdrop.background ? { background: backdrop.background } : {})}
              {...(backdrop.image ? { image: backdrop.image } : {})}
            >
              <div className="test-backdrop-label">
                <span>{backdrop.label}</span>
              </div>
              <Sheet knobs={knobs} />
            </GlassBackground>
          ))}
        </div>
      </section>

      <section className="test-section test-notes">
        <h2>How the material decides</h2>
        <ol>
          <li>
            <strong>Appearance.</strong> The theme sets what the page probably looks like: a light
            theme assumes a bright backdrop, a dark theme a dark one. That is the whole role of
            Light and Dark here. Neither owns a glass recipe.
          </li>
          <li>
            <strong>Background.</strong> A GlassBackground declares, derives or samples the
            lightness of what is really behind the glass and publishes one inherited number.
            Without one, the theme's assumption stands.
          </li>
          <li>
            <strong>Component.</strong> Variant sets translucency: regular has body and blur,
            clear shows the picture. Scale sets how far a surface may follow its backdrop: small
            fully, medium mostly, large barely.
          </li>
          <li>
            <strong>Material.</strong> From those, an effective lightness and a polarity. Small
            glass flips face and ink when the backdrop crosses the middle. Large glass converts the
            disagreement into separation, more body, and keeps the theme's ink. Clear glass over
            bright content adds a veil instead of turning opaque.
          </li>
          <li>
            <strong>Foreground.</strong> Primary, secondary and tertiary inks come from the
            polarity, and the theme's foreground family is pointed at them for the subtree. Nested
            controls follow without knowing about glass. Nested surfaces inherit their pane's
            polarity and paint as fills, so blur never stacks.
          </li>
          <li>
            <strong>Accessibility.</strong> Reduced transparency makes the face opaque in the same
            polarity. More contrast turns the soft step into a hard one and lifts the secondary
            inks. Reduced motion zeroes the transitions. Forced colours hand over to the system.
          </li>
        </ol>
      </section>
    </Theme>
  );
}
