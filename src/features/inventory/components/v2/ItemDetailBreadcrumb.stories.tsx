import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemDetailBreadcrumb } from './ItemDetailBreadcrumb';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/ItemDetailBreadcrumb',
  component: ItemDetailBreadcrumb,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onBack: { action: 'back' } },
} satisfies Meta<typeof ItemDetailBreadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NewItem: Story = { args: { onBack: () => {} } };
export const NewWithCategory: Story = {
  args: { onBack: () => {}, defaultCategoryId: 'water-beverages' },
};
export const ExistingItem: Story = {
  args: { onBack: () => {}, itemId: 'abcdef0123', itemCategoryId: 'food' },
};
