import {
  type LiquidBackdrop,
  type LiquidCSS,
  LiquidGlassToggle,
  LiquidScene,
} from '@crumza/ui/liquid';
import { type ReactElement, useEffect, useState } from 'react';
import { GlassSlider } from '../slider/GlassSlider';
import { type Marks, Pager, RoundButton, SHAPES, ShapeMenu, Trio } from './pieces';

/** The floor is a CSS value the stylesheet owns, so it follows the site's
 *  theme: the panel and every clone of it inside a pane read the same
 *  variable, and a theme change recolours all of them at once. */
const FLOOR: readonly LiquidBackdrop[] = [{ css: 'var(--studio-floor)' }];

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
 * The studio: one refracting scene over a light floor with a faint grid, and
 * the reveal's pieces laid out on it. The pieces talk to each other a little,
 * so the floor is a place to play rather than a row of samples: the pager
 * steps the menu, the hue rail colours the toggle, and Done puts it all back.
 */
export function LiquidStudio(): ReactElement {
  const dark = useDarkTheme();
  const [shape, setShape] = useState<number | null>(0);
  const [hue, setHue] = useState(HUE);
  const [level, setLevel] = useState(LEVEL);
  const [on, setOn] = useState(true);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  const [added, setAdded] = useState(false);

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
        backdrops={FLOOR}
        blur={2}
        glint={100}
        tint={dark ? 0.08 : 0.12}
        tintColor="#ffffff"
        className="liquid-stage studio"
        style={{ '--studio-hue': hue } as LiquidCSS}
        data-slot="liquid-studio"
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
      <p className="studio-note">
        Every piece is a pane of the same glass, refracting the floor behind it: the grid bends at
        the rims, and a press spreads light from the point it landed. The chevrons step the menu
        and the cross clears it; the hue rail colours the toggle; Done puts the floor back. The
        toggle is the set&apos;s{' '}
        <a href="/docs/components/liquid-glass-toggle">LiquidGlassToggle</a>, the sliders are the{' '}
        <a href="/slider">glass slider</a> on a thick rail, and the rest are panes of{' '}
        <a href="/docs/liquid">LiquidSurface</a> with the reveal&apos;s glyphs on them.
      </p>
    </div>
  );
}
