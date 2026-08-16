import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemDetailHeader } from './ItemDetailHeader';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/ItemDetailHeader',
  component: ItemDetailHeader,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onDelete: { action: 'delete' } },
} satisfies Meta<typeof ItemDetailHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NewItem: Story = { args: { isNew: true } };
export const Existing: Story = {
  args: {
    isNew: false,
    itemName: 'Bottled water',
    itemCategoryId: 'water-beverages',
    categoryName: 'Water & beverages',
    onDelete: () => {},
  },
};
