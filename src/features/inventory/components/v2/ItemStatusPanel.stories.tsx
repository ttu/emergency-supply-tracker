import type { Meta, StoryObj } from '@storybook/react-vite';
import { ItemStatusPanel } from './ItemStatusPanel';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/ItemStatusPanel',
  component: ItemStatusPanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof ItemStatusPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  args: { status: 'ok', pct: 100, quantity: 10, recommended: 10, unit: 'L' },
};
export const Warn: Story = {
  args: { status: 'warn', pct: 45, quantity: 4, recommended: 10, unit: 'L' },
};
export const Crit: Story = {
  args: { status: 'crit', pct: 10, quantity: 1, recommended: 10, unit: 'L' },
};
export const NoRecommendation: Story = {
  args: { status: 'ok', pct: 0, quantity: 5, recommended: 0, unit: 'L' },
};
