import {
  type LiquidBackdrop,
  type LiquidCSS,
  LiquidGlassToggle,
  LiquidScene,
  liquidBackdropStyle,
} from '@crumza/ui/liquid';
import { type ReactElement, useEffect, useState } from 'react';
import { GlassSlider } from '../slider/GlassSlider';
import { type Marks, Pager, RoundButton, SHAPES, ShapeMenu, Trio } from './pieces';

/** Whether the glyphs on the glass are dark or light, decided per backdrop:
 *  dark ink on the floor and the light scenes, the set's white on the photos. */
type Ink = 'dark' | 'light';

interface Scene extends LiquidBackdrop {
  readonly ink: Ink;
}

/** The strip behind the studio. The floor is a CSS value the stylesheet owns,
 *  so it follows the site's theme; the rest are the site's scenes, with a sky
 *  and a bloom after the reveal's shot of a toolbar over a flower. Scroll or
 *  sweep the stage to carry the next one under the glass, or pick a thumbnail. */
const SCENES: readonly Scene[] = [
  { label: 'Sky', src: '/liquid/sky.svg', ink: 'dark' },
  { label: 'Studio', css: 'var(--studio-floor)', ink: 'dark' },
  { label: 'Ridge', src: '/liquid/ridge.jpg', ink: 'light' },
  { label: 'Bloom', src: '/liquid/bloom.png', ink: 'dark' },
  { label: 'Duotone', src: '/liquid/duotone.png', ink: 'light' },
  { label: 'Ambience', src: '/liquid/ambience.svg', ink: 'light' },
];

/** Where the floor starts, and where Done puts it back: the reveal's green
 *  toggle, a slider a little past half, the first shape chosen. */
const HUE = 135;
const LEVEL = 60;
const NO_MARKS: Marks = { circle: false, triangle: false };

/** The site's theme, read off the document so the floor can follow it. */
function useDarkTheme(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = (): void => setDark(root.dataset['theme'] === 'dark');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

/**
 * The studio: one refracting scene over a strip of backdrops, and the reveal's
 * pieces laid out on it. The pieces talk to each other a little, so the floor
 * is a place to play rather than a row of samples: the pager steps the menu,
 * the hue rail colours the toggle, and Done puts it all back.
 */
export function LiquidStudio(): ReactElement {
  const dark = useDarkTheme();
  const [backdrop, setBackdrop] = useState(0);
  const [shape, setShape] = useState<number | null>(0);
  const [hue, setHue] = useState(HUE);
  const [level, setLevel] = useState(LEVEL);
  const [on, setOn] = useState(true);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const [added, setAdded] = useState(false);

  const scene = SCENES[backdrop] ?? SCENES[0];
  const ink: Ink = scene?.ink ?? 'dark';
  // On a light ground the glass lifts a little milk over it; over a photo it
  // takes the material's own faint black, as every pane in the set does.
  const light = ink === 'dark';

  const step = (direction: -1 | 1): void =>
    setShape((current) => {
      const n = SHAPES.length;
      if (current === null) return direction > 0 ? 0 : n - 1;
      return (current + direction + n) % n;
    });

  const reset = (): void => {
    setShape(0);
    setHue(HUE);
    setLevel(LEVEL);
    setOn(true);
    setMarks(NO_MARKS);
    setAdded(false);
  };

  return (
    <div className="studio-page">
      <LiquidScene
        backdrops={SCENES}
        backdrop={backdrop}
        onBackdropChange={setBackdrop}
        blur={2}
        glint={100}
        tint={light ? (dark ? 0.08 : 0.12) : 0.2}
        tintColor={light ? '#ffffff' : '#000000'}
        className="liquid-stage studio"
        data-ink={ink}
        style={{ '--studio-hue': hue } as LiquidCSS}
      >
        <div className="studio-set">
          <div className="studio-cell studio-cell-slider">
            <GlassSlider aria-label="Level" value={level} onValueChange={setLevel} />
          </div>
          <div className="studio-cell studio-cell-hue studio-hue">
            <GlassSlider
              aria-label="Hue"
              aria-valuetext={`${hue} degrees`}
              min={0}
              max={360}
              value={hue}
              onValueChange={setHue}
            />
          </div>
          <div className="studio-cell studio-cell-menu">
            <ShapeMenu value={shape} onChange={setShape} />
          </div>
          <div className="studio-cell studio-cell-mid">
            <RoundButton pressed={added} onPressedChange={setAdded} />
            <div className="studio-toggle">
              <LiquidGlassToggle aria-label="Power" checked={on} onCheckedChange={setOn} />
            </div>
          </div>
          <div className="studio-cell studio-cell-pager">
            <Pager onStep={step} onClear={() => setShape(null)} />
          </div>
          <div className="studio-cell studio-cell-trio">
            <Trio marks={marks} onMarksChange={setMarks} onDone={reset} />
          </div>
        </div>
      </LiquidScene>

      <div className="studio-scenes" role="group" aria-label="Backdrop">
        {SCENES.map((panel, at) => (
          <button
            key={panel.label}
            type="button"
            className="liquid-scene-thumb"
            aria-label={panel.label}
            aria-pressed={backdrop === at}
            title={panel.label}
            onClick={() => setBackdrop(at)}
          >
            <span className="liquid-scene-thumb-fill" style={liquidBackdropStyle(panel)} />
          </button>
        ))}
      </div>

      <p className="studio-note">
        Every piece is a pane of the same glass, refracting what is behind it: scroll or sweep the
        stage to carry the next backdrop under the pieces, and watch their rims bend it. The
        chevrons step the menu and the cross clears it; the hue rail colours the toggle; Done puts
        the floor back. The toggle is the set&apos;s{' '}
        <a href="/docs/components/liquid-glass-toggle">LiquidGlassToggle</a>, the sliders are the{' '}
        <a href="/slider">glass slider</a> on a thick rail, and the rest are panes of{' '}
        <a href="/docs/liquid">LiquidSurface</a> with the reveal&apos;s glyphs on them.
      </p>
    </div>
  );
}
