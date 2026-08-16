import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileInventory } from './MobileInventory';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/MobileInventory',
  component: MobileInventory,
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
  argTypes: {
    onItemSelect: { action: 'item selected' },
    onAddItem: { action: 'add item' },
  },
} satisfies Meta<typeof MobileInventory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  args: {
    onItemSelect: () => {},
    onAddItem: () => {},
  },
};
