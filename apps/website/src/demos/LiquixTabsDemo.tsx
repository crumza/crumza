import { LiquixTabs, LiquixTabsShadow } from '@crumza/ui/web';
import { type ReactElement, type ReactNode, useState } from 'react';
import { LiquixDemoSurface } from './LiquixDemoSurface';

// Filled icons, inline because three of them is not worth a dependency. They
// inherit size and colour from the button, so the tab styling drives them.
// evenodd so an inner subpath, the compass needle, cuts a hole rather than
// filling over the shape it sits in.
function Icon({ children }: { children: ReactNode }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true" className="h-[22px] w-[22px]">
      {children}
    </svg>
  );
}
const HomeIcon = (): ReactElement => (
  <Icon>
    <path d="M12 2.75 2.25 11.1V20a1.5 1.5 0 0 0 1.5 1.5H9V15h6v6.5h5.25a1.5 1.5 0 0 0 1.5-1.5v-8.9z" />
  </Icon>
);
const InboxIcon = (): ReactElement => (
  <Icon>
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 12h-4a3 3 0 0 1-6 0H5V5h14z" />
  </Icon>
);
const ExploreIcon = (): ReactElement => (
  <Icon>
    <path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6M16.6 7.4 14.2 14.2 7.4 16.6 9.8 9.8z" />
  </Icon>
);
const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'inbox', label: 'Inbox', Icon: InboxIcon },
  { id: 'explore', label: 'Explore', Icon: ExploreIcon },
];

/** A glass tab bar over a wallpaper, in an ordinary box on the page. */
export function LiquixTabsDemo(): ReactElement {
  const [active, setActive] = useState('home');
  return (
    <LiquixDemoSurface
      underlay={(width) => <LiquixTabsShadow width={width} />}
      overlay={(width) => <LiquixTabs tabs={TABS} active={active} onChange={setActive} width={width} />}
      caption="Switch tabs, or drag the capsule, to send the highlight travelling as glass over the picture. The backdrop stays put; pick another one above. Needs WebGL2; without it the bar falls back to CSS."
    />
  );
}
