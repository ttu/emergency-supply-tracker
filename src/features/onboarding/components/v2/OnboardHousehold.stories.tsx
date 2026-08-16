import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { OnboardHousehold } from './OnboardHousehold';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { createMockHousehold } from '@/shared/utils/test/factories';

const meta = {
  title: 'Design V2/Onboarding/Household',
  component: OnboardHousehold,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  // fn() args (not a bare no-op) so the Actions panel still logs calls —
  // a plain () => {} here would satisfy the props but go silent.
  args: {
    onHouseholdChange: fn(),
    onNext: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof OnboardHousehold>;
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
  },
};
