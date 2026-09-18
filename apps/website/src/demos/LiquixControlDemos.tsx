import {
  LiquixButton,
  LiquixField,
  LiquixMenu,
  LiquixPopover,
  LiquixSegmentedControl,
  LiquixSwitch,
  LiquixToaster,
  liquixToast,
} from '@crumza/ui/web';
import { type ReactElement, type ReactNode, useState } from 'react';
import { LiquixDemoSurface } from './LiquixDemoSurface';

const NOTE = ' The backdrop stays put; pick another one above. Needs WebGL2; without it the glass falls back to CSS.';

/** Centres a control in the surface. */
function Centre({ children }: { children: ReactNode }): ReactElement {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">{children}</div>;
}

function SearchIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="h-4 w-4">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function LiquixSegmentedDemo(): ReactElement {
  const [range, setRange] = useState('week');
  return (
    <LiquixDemoSurface
      overlay={() => (
        <Centre>
          <LiquixSegmentedControl
            label="Range"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            value={range}
            onValueChange={setRange}
            className="w-80"
          />
          <LiquixSegmentedControl
            label="View"
            size="sm"
            options={[
              { value: 'list', label: 'List' },
              { value: 'grid', label: 'Grid' },
            ]}
            defaultValue="grid"
            className="w-44"
          />
        </Centre>
      )}
      caption={`Choose a segment, or drag the capsule to one, and the capsule travels as glass. Arrow keys move and choose.${NOTE}`}
    />
  );
}

export function LiquixButtonDemo(): ReactElement {
  return (
    <LiquixDemoSurface
      overlay={() => (
        <Centre>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <LiquixButton size="sm">Small</LiquixButton>
            <LiquixButton>Save changes</LiquixButton>
            <LiquixButton size="lg">Get started</LiquixButton>
          </div>
          <LiquixButton radius={12} roundness={4}>
            Squared corners
          </LiquixButton>
        </Centre>
      )}
      caption={`Press a button and its glass squashes and lights at the rim; hover and it lifts. Each one sizes to its label.${NOTE}`}
    />
  );
}

export function LiquixFieldDemo(): ReactElement {
  const [query, setQuery] = useState('');
  return (
    <LiquixDemoSurface
      overlay={() => (
        <Centre>
          <LiquixField
            aria-label="Search"
            placeholder="Search photos"
            leading={<SearchIcon />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-80"
          />
          <LiquixField aria-label="Email" placeholder="you@example.com" type="email" size="sm" className="w-64" />
        </Centre>
      )}
      caption={`Type in the field: the input is live inside a trough of glass, and focusing lights its rim.${NOTE}`}
    />
  );
}

export function LiquixSwitchDemo(): ReactElement {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  return (
    <LiquixDemoSurface
      overlay={() => (
        <Centre>
          <label className="liquix-ink flex items-center gap-4 text-[13px] font-semibold">
            Wi-Fi
            <LiquixSwitch checked={wifi} onCheckedChange={setWifi} />
          </label>
          <label className="liquix-ink flex items-center gap-4 text-[13px] font-semibold">
            Bluetooth
            <LiquixSwitch checked={bluetooth} onCheckedChange={setBluetooth} />
          </label>
        </Centre>
      )}
      caption={`Tap a switch, or drag its knob: the knob lifts into glass while it moves and settles flat on the side it lands.${NOTE}`}
    />
  );
}

export function LiquixMenuDemo(): ReactElement {
  const [last, setLast] = useState<string | null>(null);
  return (
    <LiquixDemoSurface
      overlay={() => (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pt-16">
          <LiquixMenu
            label="Options"
            items={[
              { id: 'new', label: 'New file' },
              { id: 'duplicate', label: 'Duplicate' },
              { id: 'rename', label: 'Rename' },
              { id: 'delete', label: 'Delete', disabled: true },
            ]}
            onSelect={setLast}
          />
          <span className="liquix-ink text-[12px]">{last ? `Chose ${last}` : 'Nothing chosen yet'}</span>
        </div>
      )}
      caption={`Open the menu: the panel blooms from the button, and the highlight travels between items as the pointer or arrow keys move.${NOTE}`}
    />
  );
}

export function LiquixPopoverDemo(): ReactElement {
  return (
    <LiquixDemoSurface
      overlay={() => (
        <Centre>
          <LiquixPopover content="Last saved a moment ago">
            <LiquixButton>Hover me</LiquixButton>
          </LiquixPopover>
        </Centre>
      )}
      caption={`Hover or focus the button and a bubble of glass blooms from it, then shrinks away when you leave.${NOTE}`}
    />
  );
}

export function LiquixToastDemo(): ReactElement {
  let count = 0;
  return (
    <LiquixDemoSurface
      overlay={() => (
        <>
          <Centre>
            <LiquixButton
              onClick={() => {
                count += 1;
                liquixToast(`Photo ${count} saved`, { description: 'Added to your library.' });
              }}
            >
              Show a toast
            </LiquixButton>
          </Centre>
          <LiquixToaster />
        </>
      )}
      caption={`Toasts rise from the bottom on a spring and dismiss themselves; swipe one sideways to send it away sooner.${NOTE}`}
    />
  );
}
