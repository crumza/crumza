import { useState, type ReactElement } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  Field,
  Glass,
  Input,
  Progress,
  Segment,
  SegmentedControl,
  Switch,
  Theme,
  Scene,
  type Material,
} from "@crumza/ui/web";
import { glassBackdrop, darkGlassBackdrop } from "../demos/backdrops";

const entries = [
  {
    id: "buttons",
    title: "A good place to start",
    category: "Actions",
    detail: "Button",
    href: "button",
    background: "",
  },
  {
    id: "glass",
    title: "Light, held at the edges",
    category: "Materials",
    detail: "Liquid glass",
    href: "glass",
    background: "tile-dark",
  },
  {
    id: "segmented",
    title: "One thing at a time",
    category: "Navigation",
    detail: "Segmented control",
    href: "segmented-control",
    background: "tile-sage",
  },
  {
    id: "dialog",
    title: "Room for a decision",
    category: "Overlays",
    detail: "Dialog",
    href: "dialog",
    background: "tile-blue",
  },
  {
    id: "input",
    title: "Nothing in your way",
    category: "Forms",
    detail: "Input",
    href: "input",
    background: "tile-clay",
  },
  {
    id: "switch",
    title: "The little details",
    category: "Forms",
    detail: "Switch",
    href: "switch",
    background: "",
  },
  {
    id: "frosted",
    title: "A softer kind of depth",
    category: "Materials",
    detail: "Frosted glass",
    href: "glass",
    background: "tile-stripe",
  },
  {
    id: "progress",
    title: "A sense of progress",
    category: "Feedback",
    detail: "Progress",
    href: "progress",
    background: "tile-lime",
  },
  {
    id: "badge",
    title: "Just enough emphasis",
    category: "Feedback",
    detail: "Badge",
    href: "badge",
    background: "tile-blue",
  },
  {
    id: "card",
    title: "A little breathing room",
    category: "Layout",
    detail: "Card",
    href: "card",
    background: "",
  },
  {
    id: "checkbox",
    title: "Keep what matters",
    category: "Forms",
    detail: "Checkbox",
    href: "checkbox",
    background: "tile-sage",
  },
  {
    id: "overrides",
    title: "Make it your own",
    category: "Actions",
    detail: "Local overrides",
    href: "button",
    background: "tile-clay",
  },
] as const;
const categories = [
  "All",
  "Actions",
  "Materials",
  "Forms",
  "Overlays",
  "Navigation",
  "Feedback",
  "Layout",
];

function Preview({ id, configured }: { id: string; configured: boolean }): ReactElement {
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState(42);
  switch (id) {
    case "buttons":
      return (
        <div className="preview-row">
          <Button tone="primary" onClick={() => setSaved(!saved)}>
            {saved ? "Saved" : "Save changes"}
          </Button>
          <Button variant="bordered" onClick={() => setSaved(false)}>
            Reset
          </Button>
        </div>
      );
    case "glass":
      return (
        <Theme scheme="dark" {...(!configured ? { material: "liquid" as const } : {})}>
          <div className="preview-row">
            <Button tone="primary" radius={24} onClick={() => setSaved(!saved)}>
              {saved ? "Following" : "Follow along"}
            </Button>
            <Button radius={24} onClick={() => setSaved(!saved)} aria-pressed={saved}>
              Bookmark
            </Button>
          </div>
        </Theme>
      );
    case "segmented":
      return (
        <SegmentedControl defaultValue="week" aria-label="View period">
          <Segment value="day">Day</Segment>
          <Segment value="week">Week</Segment>
          <Segment value="month">Month</Segment>
        </SegmentedControl>
      );
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger render={<Button />}>Take a moment</DialogTrigger>
          <DialogContent material={configured ? undefined : "frosted"}>
            <DialogTitle>A little room to think.</DialogTitle>
            <DialogDescription>
              Your work stays here. Close this preview whenever you're ready.
            </DialogDescription>
            <div className="preview-row" style={{ marginTop: 20 }}>
              <DialogClose render={<Button variant="bordered" />}>Close preview</DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      );
    case "input":
      return (
        <div className="preview-stack">
          <Field label="Project name" htmlFor="collection-project">
            <Input id="collection-project" placeholder="Something good" />
          </Field>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Give your next idea a home.</span>
        </div>
      );
    case "switch":
      return (
        <div className="preview-stack">
          <Switch label="A little more focus" defaultChecked />
          <Switch label="Keep me in the loop" />
        </div>
      );
    case "frosted":
      return (
        <Glass {...(!configured ? { material: "frosted" as const } : {})} className="preview-panel">
          <h3>Clarity comes first.</h3>
          <p>A soft backdrop. A considered edge. Nothing between you and the words.</p>
        </Glass>
      );
    case "progress":
      return (
        <div className="preview-stack">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Coming together</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} aria-label="Project completion" />
          <Button
            variant="bordered"
            onClick={() => setProgress(progress >= 100 ? 0 : Math.min(progress + 10, 100))}
          >
            {progress >= 100 ? "Start again" : "A little further"}
          </Button>
        </div>
      );
    case "badge":
      return (
        <div className="preview-row">
          <Badge>Draft</Badge>
          <Badge variant="accent">In good shape</Badge>
          <Badge variant="outline">Version 01</Badge>
        </div>
      );
    case "card":
      return (
        <Card className="preview-panel">
          <h3>Less, but considered.</h3>
          <p>A quiet surface for the things that deserve your attention.</p>
        </Card>
      );
    case "checkbox":
      return (
        <div className="preview-stack">
          <Checkbox label="Make something useful" defaultChecked />
          <Checkbox label="Leave room for delight" defaultChecked />
          <Checkbox label="Know when to stop" />
        </div>
      );
    default:
      return (
        <div className="preview-row">
          <Button material="solid" tone="primary" radius={4}>
            Solid
          </Button>
          <Button material="liquid" tone="secondary" radius={24}>
            Liquid
          </Button>
        </div>
      );
  }
}

export default function Collection({
  configurable = false,
}: {
  configurable?: boolean;
}): ReactElement {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState<Material>("liquid");
  const [intensity, setIntensity] = useState(0.5);
  const [radius, setRadius] = useState(24);
  const [brand, setBrand] = useState("forest");
  const [scheme, setScheme] = useState<"light" | "dark">("light");
  const shown = entries.filter(
    (item) =>
      (filter === "All" || item.category === filter) &&
      (item.title + item.detail + item.category).toLowerCase().includes(search.toLowerCase()),
  );
  const colors =
    brand === "ink"
      ? { background: "#292c35", foreground: "#ffffff" }
      : brand === "plum"
        ? { background: "#633d63", foreground: "#ffffff" }
        : { background: "#245c46", foreground: "#ffffff" };
  return (
    <section aria-label="Component collection">
      <div className="catalog-toolbar">
        {categories.map((category) => (
          <button
            type="button"
            className="filter-button"
            key={category}
            aria-pressed={filter === category}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
        <label className="catalog-search">
          <span className="sr-only">Search components</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find a component"
          />
        </label>
      </div>
      {configurable && (
        <div className="appearance-controls">
          <label>
            Material
            <select value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
              <option value="solid">Solid</option>
              <option value="frosted">Frosted</option>
              <option value="liquid">Liquid</option>
            </select>
          </label>
          <label>
            Clarity
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={intensity}
              disabled={material === "solid"}
              onChange={(e) => setIntensity(Number(e.target.value))}
            />
            <output>{Math.round(intensity * 100)}%</output>
          </label>
          <label>
            Radius
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <output>{radius}</output>
          </label>
          <label>
            Brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="forest">Forest</option>
              <option value="ink">Ink</option>
              <option value="plum">Plum</option>
            </select>
          </label>
          <label>
            Scheme
            <select value={scheme} onChange={(e) => setScheme(e.target.value as "light" | "dark")}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      )}
      <p className="sr-only" role="status">
        {shown.length} previews
      </p>
      <Theme
        material={material}
        intensity={intensity}
        radius={radius}
        primary={colors}
        secondary={{ background: "#dddbed", foreground: "#302846" }}
      >
        <div className="collection-grid">
          {shown.map((item) => (
            <article className="collection-item" key={item.id}>
              <Theme
                scheme={scheme}
                primary={colors}
                secondary={{ background: "#dddbed", foreground: "#302846" }}
              >
                <Scene
                  backdrop={scheme === "dark" || item.background === "tile-dark" ? darkGlassBackdrop : glassBackdrop}
                  className={"preview-tile " + item.background}
                >
                  <Preview id={item.id} configured={configurable} />
                </Scene>
              </Theme>
              <a className="tile-label" href={"/docs/components/" + item.href}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </a>
            </article>
          ))}
        </div>
      </Theme>
      {shown.length === 0 && (
        <p className="empty-state">Nothing here yet. Try a different term or choose All.</p>
      )}
      {configurable && (
        <pre className="code-preview">
          <code>{`import { Theme, Button } from '@crumza/ui';\n\n<Theme material="${material}" intensity={${intensity}} radius={${radius}}\n  primary={{ background: '${colors.background}', foreground: '#ffffff' }}>\n  <Button tone="primary">Save changes</Button>\n</Theme>`}</code>
        </pre>
      )}
    </section>
  );
}
