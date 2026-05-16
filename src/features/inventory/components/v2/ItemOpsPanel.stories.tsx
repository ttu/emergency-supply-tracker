import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemOpsPanel } from './ItemOpsPanel';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/ItemOpsPanel',
  component: ItemOpsPanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onAdjust: { action: 'adjust' } },
} satisfies Meta<typeof ItemOpsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  args: { itemName: 'Bottled water', onAdjust: () => {} },
};
export const Pantry: Story = {
  args: { itemName: 'Bottled water', onAdjust: () => {} },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
