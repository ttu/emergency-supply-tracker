import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep05Items } from './OnboardStep05Items';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step05Items',
  component: OnboardStep05Items,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onToggleCategory: { action: 'toggle category' },
    onNext: { action: 'next' },
    onBack: { action: 'back' },
  },
} satisfies Meta<typeof OnboardStep05Items>;
export default meta;
type Story = StoryObj<typeof meta>;

const ALL = new Set([
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
  'pets',
]);

export const AllEnabled: Story = {
  args: {
    enabledCategories: ALL,
    onToggleCategory: () => {},
    onNext: () => {},
    onBack: () => {},
  },
};
export const SomeDisabled: Story = {
  args: {
    enabledCategories: new Set(['water-beverages', 'food', 'medical-health']),
    onToggleCategory: () => {},
    onNext: () => {},
    onBack: () => {},
  },
};
