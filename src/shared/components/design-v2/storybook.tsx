import type { ReactNode } from 'react';
import { AllProviders } from '@/shared/components/AllProviders';
import {
  createMockAppData,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { saveAppData } from '@/shared/utils/storage/localStorage';
import type { DesignV2Theme } from '@/shared/types';

interface DesignV2StoryProps {
  /** Cockpit by default — matches the production first-run theme. */
  theme?: DesignV2Theme;
  children: ReactNode;
}

/**
 * Wraps a Storybook story in the full provider tree with a v2 theme preset
 * in localStorage. Used as a decorator from every v2 *.stories.tsx file.
 *
 * The localStorage write is intentionally synchronous (not in an effect) so
 * the SettingsProvider hydrates with the chosen theme on first render — no
 * flash of the wrong theme before useLayoutEffect can patch it up.
 */
export function DesignV2Story({
  theme = 'cockpit',
  children,
}: Readonly<DesignV2StoryProps>) {
  saveAppData(
    createMockAppData({
      settings: createMockSettings({ theme, language: 'en' }),
    }),
  );
  return <AllProviders>{children}</AllProviders>;
}
