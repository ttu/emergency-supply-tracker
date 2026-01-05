import type { Meta, StoryObj } from '@storybook/react-vite';
import { HouseholdPresetSelector } from './HouseholdPresetSelector';
import { SettingsProvider } from '@/features/settings';
import { useState } from 'react';

const meta = {
  title: 'Onboarding/HouseholdPresetSelector',
  component: HouseholdPresetSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <div style={{ maxWidth: '800px', padding: '2rem' }}>
          <Story />
        </div>
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof HouseholdPresetSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSelectPreset: (preset) => {
      console.log('Selected preset:', preset);
    },
  },
};

export const WithSingleSelected: Story = {
  args: {
    selectedPreset: 'single',
    onSelectPreset: (preset) => {
      console.log('Selected preset:', preset);
    },
  },
};

export const WithCoupleSelected: Story = {
  args: {
    selectedPreset: 'couple',
    onSelectPreset: (preset) => {
      console.log('Selected preset:', preset);
    },
  },
};

export const WithFamilySelected: Story = {
  args: {
    selectedPreset: 'family',
    onSelectPreset: (preset) => {
      console.log('Selected preset:', preset);
    },
  },
};

export const WithCustomSelected: Story = {
  args: {
    selectedPreset: 'custom',
    onSelectPreset: (preset) => {
      console.log('Selected preset:', preset);
    },
  },
};

export const Interactive: Story = {
  args: {
    onSelectPreset: () => {},
  },
  render: () => {
    const InteractiveSelector = () => {
      const [selected, setSelected] = useState<string | undefined>(undefined);

      return (
        <HouseholdPresetSelector
          selectedPreset={selected}
          onSelectPreset={(preset) => {
            setSelected(preset.id);
            console.log('Selected preset:', preset);
          }}
        />
      );
    };

    return <InteractiveSelector />;
  },
};
