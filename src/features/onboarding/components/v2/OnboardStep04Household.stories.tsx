import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep04Household } from './OnboardStep04Household';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { createMockHousehold } from '@/shared/utils/test/factories';

const meta = {
  title: 'Design V2/Onboarding/Step04Household',
  component: OnboardStep04Household,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onHouseholdChange: { action: 'household changed' },
    onNext: { action: 'next' },
    onBack: { action: 'back' },
  },
} satisfies Meta<typeof OnboardStep04Household>;
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
    onHouseholdChange: () => {},
    onNext: () => {},
    onBack: () => {},
  },
};
export const Family: Story = {
  args: {
    household: createMockHousehold({
      adults: 2,
      children: 2,
      pets: 1,
      supplyDurationDays: 14,
    }),
    onHouseholdChange: () => {},
    onNext: () => {},
    onBack: () => {},
  },
};
