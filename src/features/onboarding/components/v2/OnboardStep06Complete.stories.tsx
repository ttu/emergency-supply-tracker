import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep06Complete } from './OnboardStep06Complete';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { createMockHousehold } from '@/shared/utils/test/factories';

const meta = {
  title: 'Design V2/Onboarding/Step06Complete',
  component: OnboardStep06Complete,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onComplete: { action: 'complete' } },
} satisfies Meta<typeof OnboardStep06Complete>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Couple: Story = {
  args: {
    household: createMockHousehold({
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 7,
    }),
    enabledCategories: new Set([
      'water-beverages',
      'food',
      'cooking-heat',
      'light-power',
      'communication-info',
      'medical-health',
      'hygiene-sanitation',
      'tools-supplies',
      'cash-documents',
    ]),
    onComplete: () => {},
  },
};
