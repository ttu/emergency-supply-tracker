import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep06QuickSetup } from './OnboardStep06QuickSetup';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step06QuickSetup',
  component: OnboardStep06QuickSetup,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof OnboardStep06QuickSetup>;
export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  onAddItems: () => {},
  onSkip: () => {},
  onTryDemoData: () => {},
  onBack: () => {},
};

export const Couple: Story = {
  args: {
    ...base,
    household: {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
  },
};

export const FamilyWithPets: Story = {
  args: {
    ...base,
    household: {
      adults: 2,
      children: 2,
      pets: 1,
      supplyDurationDays: 14,
      useFreezer: true,
    },
  },
};
