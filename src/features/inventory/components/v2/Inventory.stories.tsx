import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inventory } from './Inventory';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/Inventory',
  component: Inventory,
  parameters: { layout: 'padded' },
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
} satisfies Meta<typeof Inventory>;
export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  onItemSelect: () => {},
  onAddItem: () => {},
};

export const Cockpit: Story = { args };
export const Civil: Story = {
  args,
  decorators: [
    (Story) => (
      <DesignV2Story theme="civil">
        <Story />
      </DesignV2Story>
    ),
  ],
};
export const Pantry: Story = {
  args,
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
