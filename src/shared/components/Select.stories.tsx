import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const meta = {
  title: 'Components/Common/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const categoryOptions = [
  { value: '', label: 'Select a category...', disabled: true },
  { value: 'water-beverages', label: 'Water & Beverages' },
  { value: 'food-staples', label: 'Food Staples' },
  { value: 'canned-preserved', label: 'Canned & Preserved Foods' },
  { value: 'hygiene', label: 'Hygiene & Sanitation' },
  { value: 'medical', label: 'Medical Supplies' },
  { value: 'tools-equipment', label: 'Tools & Equipment' },
  { value: 'communication', label: 'Communication & Lighting' },
  { value: 'heating-cooking', label: 'Heating & Cooking' },
  { value: 'other', label: 'Other Supplies' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'fi', label: 'Suomi' },
];

const householdPresetOptions = [
  { value: '', label: 'Select preset...', disabled: true },
  { value: 'single', label: 'Single Person' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family (2 adults + 2 children)' },
  { value: 'custom', label: 'Custom Configuration' },
];

export const Default: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
    defaultValue: '',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
    defaultValue: 'water-beverages',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Language',
    options: languageOptions,
    helperText: 'Choose your preferred language',
    defaultValue: 'en',
  },
};

export const WithError: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
    error: 'Please select a category',
    defaultValue: '',
  },
};

export const Required: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
    required: true,
    defaultValue: '',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Category',
    options: categoryOptions,
    disabled: true,
    defaultValue: 'water-beverages',
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Household Preset',
    options: householdPresetOptions,
    fullWidth: true,
    defaultValue: '',
  },
  parameters: {
    layout: 'padded',
  },
};

export const NoLabel: Story = {
  args: {
    options: languageOptions,
    defaultValue: 'en',
  },
};
