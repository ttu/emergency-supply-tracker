import type { ReactNode } from 'react';
import { ThemeApplier } from './ThemeApplier';
import { DocumentMetadata } from '@/shared/components/DocumentMetadata';

interface SettingsEffectsProps {
  readonly children: ReactNode;
}

/**
 * Wrapper component that combines settings-dependent effects.
 *
 * This component bundles ThemeApplier and DocumentMetadata into a single
 * composable component for use with composeProviders.
 *
 * - ThemeApplier: Applies theme CSS variables to document root
 * - DocumentMetadata: Sets document title and meta tags based on language
 *
 * Requires: SettingsProvider must be an ancestor (ThemeApplier uses useSettings)
 */
export function SettingsEffects({ children }: SettingsEffectsProps) {
  return (
    <ThemeApplier>
      <DocumentMetadata />
      {children}
    </ThemeApplier>
  );
}
