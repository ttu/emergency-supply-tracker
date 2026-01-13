import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShoppingListExport } from './ShoppingListExport';
import { AllProviders } from '@/shared/components/AllProviders';

const meta = {
  title: 'Settings/ShoppingListExport',
  component: ShoppingListExport,
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
} satisfies Meta<typeof ShoppingListExport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
