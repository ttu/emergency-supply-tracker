import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataErrorPage } from './DataErrorPage';
import * as localStorage from '@/shared/utils/storage/localStorage';

// Mock the localStorage functions for Storybook
const mockValidationResult = {
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

// Override the getLastDataValidationResult to return mock data
const originalGetLastDataValidationResult =
  localStorage.getLastDataValidationResult;

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
  decorators: [
    (Story) => {
      // Mock the validation result for the story
      (
        localStorage as {
          getLastDataValidationResult: () => typeof mockValidationResult | null;
        }
      ).getLastDataValidationResult = () => mockValidationResult;

      return <Story />;
    },
  ],
  // Cleanup after stories
  beforeEach: () => {
    (
      localStorage as {
        getLastDataValidationResult: typeof originalGetLastDataValidationResult;
      }
    ).getLastDataValidationResult = originalGetLastDataValidationResult;
  },
} satisfies Meta<typeof DataErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing multiple validation errors.
 * The details section is collapsed by default but can be expanded to see error details.
 */
export const Default: Story = {
  args: {},
};

/**
 * State with the onRetry callback provided.
 * When delete is confirmed, onRetry will be called instead of page reload.
 */
export const WithRetryCallback: Story = {
  args: {
    onRetry: () => {},
  },
};

/**
 * State with a single validation error.
 */
export const SingleError: Story = {
  decorators: [
    (Story) => {
      (
        localStorage as {
          getLastDataValidationResult: () => typeof mockValidationResult | null;
        }
      ).getLastDataValidationResult = () => ({
        isValid: false,
        errors: [
          {
            field: 'settings.language',
            message: 'Invalid language: "de". Must be one of: en, fi',
            value: 'de',
          },
        ],
      });
      return <Story />;
    },
  ],
};

/**
 * State when no validation result is available (unknown error).
 * Shows "Unknown validation error" as the fallback message.
 */
export const UnknownError: Story = {
  decorators: [
    (Story) => {
      (
        localStorage as {
          getLastDataValidationResult: () => typeof mockValidationResult | null;
        }
      ).getLastDataValidationResult = () => null;
      return <Story />;
    },
  ],
};

/**
 * State when validation result exists but has empty errors array.
 * Also shows "Unknown validation error" as the fallback.
 */
export const EmptyErrorsArray: Story = {
  decorators: [
    (Story) => {
      (
        localStorage as {
          getLastDataValidationResult: () => typeof mockValidationResult | null;
        }
      ).getLastDataValidationResult = () => ({
        isValid: false,
        errors: [],
      });
      return <Story />;
    },
  ],
};

/**
 * State with many validation errors to test scrolling behavior.
 */
export const ManyErrors: Story = {
  decorators: [
    (Story) => {
      (
        localStorage as {
          getLastDataValidationResult: () => typeof mockValidationResult | null;
        }
      ).getLastDataValidationResult = () => ({
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
      });
      return <Story />;
    },
  ],
};
