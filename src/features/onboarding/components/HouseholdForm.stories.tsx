import type { Meta, StoryObj } from '@storybook/react-vite';
import { HouseholdForm } from './HouseholdForm';
import { SettingsProvider } from '@/features/settings';

const meta = {
  title: 'Onboarding/HouseholdForm',
  component: HouseholdForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div style={{ maxWidth: '600px', padding: '2rem' }}>
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof HouseholdForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      adults: 3,
      children: 2,
      supplyDays: 14,
      useFreezer: true,
    },
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const WithCancel: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
    onCancel: () => {
      console.log('Form cancelled');
      alert('Form cancelled');
    },
  },
};

export const SinglePerson: Story = {
  args: {
    initialData: {
      adults: 1,
      children: 0,
      supplyDays: 7,
      useFreezer: false,
    },
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const LargeFamily: Story = {
  args: {
    initialData: {
      adults: 4,
      children: 5,
      supplyDays: 14,
      useFreezer: true,
    },
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
  },
};

export const ExtendedSupplyDuration: Story = {
  args: {
    initialData: {
      adults: 2,
      children: 2,
      supplyDays: 30,
      useFreezer: true,
    },
    onSubmit: (data) => {
      console.log('Form submitted:', data);
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    },
  },
};
