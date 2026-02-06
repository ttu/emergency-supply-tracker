import { useState } from 'react';
import type { Meta, StoryFn } from '@storybook/react-vite';
import { AutocompleteInput } from './AutocompleteInput';

const meta: Meta<typeof AutocompleteInput> = {
  title: 'Common/AutocompleteInput',
  component: AutocompleteInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

const locationSuggestions = [
  'Kitchen pantry',
  'Garage shelf',
  'Basement storage',
  'Bedroom closet',
  'Bathroom cabinet',
  'Living room',
  'Utility room',
  'Outdoor shed',
];

const ControlledAutocomplete = ({
  suggestions = locationSuggestions,
  initialValue = '',
  ...props
}: {
  suggestions?: string[];
  initialValue?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <AutocompleteInput
      suggestions={suggestions}
      value={value}
      onChange={setValue}
      {...props}
    />
  );
};

export const Default: StoryFn = () => (
  <ControlledAutocomplete
    label="Location"
    placeholder="Enter storage location..."
  />
);

export const WithInitialValue: StoryFn = () => (
  <ControlledAutocomplete
    label="Location"
    placeholder="Enter storage location..."
    initialValue="Gar"
  />
);

export const WithFewSuggestions: StoryFn = () => (
  <ControlledAutocomplete
    label="Location"
    placeholder="Enter storage location..."
    suggestions={['Kitchen', 'Garage', 'Basement']}
  />
);

export const NoSuggestions: StoryFn = () => (
  <ControlledAutocomplete
    label="Location"
    placeholder="Enter storage location..."
    suggestions={[]}
  />
);

export const WithHelperText: StoryFn = () => (
  <ControlledAutocomplete
    label="Location"
    placeholder="Enter storage location..."
    helperText="Start typing to see suggestions"
  />
);
