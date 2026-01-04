import type { Meta, StoryObj } from '@storybook/react-vite';
import { HouseholdForm } from './HouseholdForm';
import { HouseholdProvider } from '@/features/household';

const meta = {
  title: 'Settings/HouseholdForm',
  component: HouseholdForm,
  decorators: [
    (Story) => (
      <HouseholdProvider>
        <Story />
      </HouseholdProvider>
    ),
  ],
} satisfies Meta<typeof HouseholdForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFreezer: Story = {
  decorators: [
    (Story) => {
      // In a real scenario, we'd pre-configure the provider
      // For now this shows the same default state
      return <Story />;
    },
  ],
};
