import type { Meta, StoryObj } from '@storybook/react-vite';
import { DashboardHeader } from './DashboardHeader';
import { SettingsProvider } from '../../contexts/SettingsProvider';

const meta = {
  title: 'Dashboard/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof DashboardHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Excellent: Story = {
  args: {
    preparednessScore: 95,
    householdSize: 4,
    supplyDays: 7,
  },
};

export const Good: Story = {
  args: {
    preparednessScore: 65,
    householdSize: 2,
    supplyDays: 7,
  },
};

export const NeedsWork: Story = {
  args: {
    preparednessScore: 30,
    householdSize: 3,
    supplyDays: 7,
  },
};

export const SinglePerson: Story = {
  args: {
    preparednessScore: 80,
    householdSize: 1,
    supplyDays: 3,
  },
};

export const LargeFamily: Story = {
  args: {
    preparednessScore: 75,
    householdSize: 6,
    supplyDays: 14,
  },
};
