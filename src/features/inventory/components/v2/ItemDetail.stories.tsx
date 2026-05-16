import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemDetail, NEW_ITEM_ID } from './ItemDetail';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/ItemDetail',
  component: ItemDetail,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onBack: { action: 'back' } },
} satisfies Meta<typeof ItemDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NewItem: Story = {
  args: { itemId: NEW_ITEM_ID, onBack: () => {} },
};
export const NotFound: Story = {
  args: { itemId: 'unknown-id', onBack: () => {} },
};
