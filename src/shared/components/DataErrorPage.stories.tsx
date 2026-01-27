import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataErrorPage } from './DataErrorPage';
import type { DataValidationResult } from '@/shared/utils/validation/appDataValidation';

// Mock validation results for different story scenarios
const mockValidationResult: DataValidationResult = {
  isValid: false,
  errors: [
    {
      field: 'settings.theme',
      message:
        'Invalid theme: "invalid". Must be one of: ocean, forest, sunset',
      value: 'invalid',
    },
    {
      field: 'household.adults',
      message: 'adults must be a non-negative number',
      value: -1,
    },
    {
      field: 'settings.dailyCaloriesPerPerson',
      message: 'dailyCaloriesPerPerson must be a non-negative number',
      value: -500,
    },
  ],
};

const meta = {
  title: 'Components/Error/DataErrorPage',
  component: DataErrorPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    onRetry: { action: 'retry clicked' },
  },
} satisfies Meta<typeof DataErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing multiple validation errors.
 * The details section is collapsed by default but can be expanded to see error details.
 */
export const Default: Story = {
  args: {
    validationResultOverride: mockValidationResult,
  },
};

/**
 * State with the onRetry callback provided.
 * When delete is confirmed, onRetry will be called instead of page reload.
 */
export const WithRetryCallback: Story = {
  args: {
    validationResultOverride: mockValidationResult,
    onRetry: () => {},
  },
};

/**
 * State with a single validation error.
 */
export const SingleError: Story = {
  args: {
    validationResultOverride: {
      isValid: false,
      errors: [
        {
          field: 'settings.language',
          message: 'Invalid language: "de". Must be one of: en, fi',
          value: 'de',
        },
      ],
    },
  },
};

/**
 * State when no validation result is available (unknown error).
 * Shows "Unknown validation error" as the fallback message.
 */
export const UnknownError: Story = {
  args: {
    validationResultOverride: null,
  },
};

/**
 * State when validation result exists but has empty errors array.
 * Also shows "Unknown validation error" as the fallback.
 */
export const EmptyErrorsArray: Story = {
  args: {
    validationResultOverride: {
      isValid: false,
      errors: [],
    },
  },
};

/**
 * State with many validation errors to test scrolling behavior.
 */
export const ManyErrors: Story = {
  args: {
    validationResultOverride: {
      isValid: false,
      errors: [
        {
          field: 'settings.theme',
          message: 'Invalid theme value',
          value: 'bad',
        },
        {
          field: 'settings.language',
          message: 'Invalid language value',
          value: 'xx',
        },
        {
          field: 'household.adults',
          message: 'adults must be non-negative',
          value: -1,
        },
        {
          field: 'household.children',
          message: 'children must be non-negative',
          value: -2,
        },
        {
          field: 'household.pets',
          message: 'pets must be non-negative',
          value: -3,
        },
        {
          field: 'household.supplyDurationDays',
          message: 'supplyDurationDays must be non-negative',
          value: -7,
        },
        {
          field: 'settings.dailyCaloriesPerPerson',
          message: 'dailyCaloriesPerPerson must be non-negative',
          value: -100,
        },
        {
          field: 'settings.dailyWaterPerPerson',
          message: 'dailyWaterPerPerson must be non-negative',
          value: -5,
        },
      ],
    },
  },
};
