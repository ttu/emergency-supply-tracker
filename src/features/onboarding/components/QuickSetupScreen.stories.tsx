import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuickSetupScreen } from './QuickSetupScreen';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';
import { createMockHousehold } from '@/shared/utils/test/factories';

const meta = {
  title: 'Onboarding/QuickSetupScreen',
  component: QuickSetupScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof QuickSetupScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultHousehold = createMockHousehold({
  adults: 2,
  children: 1,
  supplyDurationDays: 3,
  useFreezer: true,
});

export const Default: Story = {
  args: {
    household: defaultHousehold,
    onAddItems: () => {
      console.log('Add items clicked');
    },
    onSkip: () => {
      console.log('Skip clicked');
    },
  },
};

export const SinglePerson: Story = {
  args: {
    household: createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: true,
    }),
    onAddItems: () => {
      console.log('Add items clicked');
    },
    onSkip: () => {
      console.log('Skip clicked');
    },
  },
};

export const LargeFamily: Story = {
  args: {
    household: createMockHousehold({
      adults: 2,
      children: 3,
      supplyDurationDays: 7,
      useFreezer: true,
    }),
    onAddItems: () => {
      console.log('Add items clicked');
    },
    onSkip: () => {
      console.log('Skip clicked');
    },
  },
};

export const NoFreezer: Story = {
  args: {
    household: {
      adults: 2,
      children: 1,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    onAddItems: () => {
      console.log('Add items clicked');
    },
    onSkip: () => {
      console.log('Skip clicked');
    },
  },
};

export const ExtendedSupply: Story = {
  args: {
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 14,
      useFreezer: true,
    },
    onAddItems: () => {
      console.log('Add items clicked');
    },
    onSkip: () => {
      console.log('Skip clicked');
    },
  },
};

export const Interactive: Story = {
  args: {
    household: defaultHousehold,
    onAddItems: () => {
      alert('Items would be added to inventory');
    },
    onSkip: () => {
      alert('Skipping quick setup');
    },
  },
};
