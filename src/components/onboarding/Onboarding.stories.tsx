import type { Meta, StoryObj } from '@storybook/react-vite';
import { Onboarding } from './Onboarding';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';

const meta = {
  title: 'Onboarding/Onboarding',
  component: Onboarding,
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
} satisfies Meta<typeof Onboarding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onComplete: (household, items) => {
      console.log('Onboarding completed!');
      console.log('Household config:', household);
      console.log('Items added:', items.length);
    },
  },
};

export const Interactive: Story = {
  args: {
    onComplete: (household, items) => {
      alert(
        `Onboarding complete!\nHousehold: ${household.adults} adults, ${household.children} children\nItems: ${items.length}`,
      );
    },
  },
};
