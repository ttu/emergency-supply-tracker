import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileItemDetail } from './MobileItemDetail';
import { NEW_ITEM_ID } from './ItemDetail';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/MobileItemDetail',
  component: MobileItemDetail,
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onBack: { action: 'back' } },
} satisfies Meta<typeof MobileItemDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NewItem: Story = {
  args: { itemId: NEW_ITEM_ID, onBack: () => {} },
};
export const NotFound: Story = {
  args: { itemId: 'unknown', onBack: () => {} },
};
