import { LIQUID_RADIUS_MAX, LIQUID_RANGES } from '@crumza/ui/liquid';
import { Switch } from '@crumza/ui/web';
import type { ReactElement, ReactNode } from 'react';
import { type LiquidSettings, liquidScenes, withFrosted } from './liquid';

interface RowProps {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly display: string;
  readonly onChange: (value: number) => void;
}

function Row({ label, min, max, step, value, display, onChange }: RowProps): ReactElement {
  return (
    <label className="liquid-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>{display}</output>
    </label>
  );
}

function Group({ label, children }: { label?: string; children: ReactNode }): ReactElement {
  return (
    <section className="liquid-group">
      {label && <h3>{label}</h3>}
      {children}
    </section>
  );
}

/**
 * The only knobs the liquid set exposes: a frosted toggle, blur, glint, tint and
 * radius, plus the scene the glass sits over. Column layout is the catalogue's
 * inspector; row layout sits above a docs demo.
 */
export function LiquidInspector({
  settings,
  onChange,
  layout = 'column',
}: {
  readonly settings: LiquidSettings;
  readonly onChange: (next: LiquidSettings) => void;
  readonly layout?: 'column' | 'row';
}): ReactElement {
  const set = <K extends keyof LiquidSettings>(key: K, value: LiquidSettings[K]): void =>
    onChange({ ...settings, [key]: value });
  const grouped = layout === 'column';
  return (
    <div className={grouped ? 'liquid-inspector' : 'appearance-controls demo-controls liquid-controls'}>
      <Group {...(grouped ? { label: 'Material' } : {})}>
        <Switch
          label="Frosted"
          checked={settings.frosted}
          onCheckedChange={(frosted) => onChange(withFrosted(settings, frosted))}
        />
      </Group>
      <Group {...(grouped ? { label: 'Optics' } : {})}>
        <Row
          label="Blur"
          {...LIQUID_RANGES.blur}
          value={settings.blur}
          display={settings.blur.toFixed(1)}
          onChange={(blur) => set('blur', blur)}
        />
        <Row
          label="Glint"
          {...LIQUID_RANGES.glint}
          value={settings.glint}
          display={String(settings.glint)}
          onChange={(glint) => set('glint', glint)}
        />
        <Row
          label="Tint"
          {...LIQUID_RANGES.tint}
          value={settings.tint}
          display={`${Math.round(settings.tint * 100)}%`}
          onChange={(tint) => set('tint', tint)}
        />
        <label className="liquid-row">
          <span>Colour</span>
          <input
            type="color"
            value={settings.tintColor}
            onChange={(event) => set('tintColor', event.target.value)}
          />
          <output>{settings.tintColor.slice(1).toUpperCase()}</output>
        </label>
      </Group>
      <Group {...(grouped ? { label: 'Geometry' } : {})}>
        <Row
          label="Radius"
          min={0}
          max={LIQUID_RADIUS_MAX}
          step={1}
          value={settings.radius}
          display={String(settings.radius)}
          onChange={(radius) => set('radius', radius)}
        />
      </Group>
      <Group {...(grouped ? { label: 'Scene' } : {})}>
        <div className="liquid-scenes" role="group" aria-label="Scene">
          {liquidScenes.map((image) => (
            <button
              key={image.src}
              type="button"
              className="liquid-scene-thumb"
              aria-label={image.label}
              aria-pressed={settings.scene === image.src}
              title={image.label}
              style={{ backgroundImage: `url(${image.src})` }}
              onClick={() => set('scene', image.src)}
            />
          ))}
        </div>
      </Group>
    </div>
  );
}
