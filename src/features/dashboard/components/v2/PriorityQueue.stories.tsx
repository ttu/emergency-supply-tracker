import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriorityQueue } from './PriorityQueue';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Dashboard/PriorityQueue',
  component: PriorityQueue,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onViewAll: { action: 'view all' },
    onItemSelect: { action: 'select item' },
  },
} satisfies Meta<typeof PriorityQueue>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onViewAll: () => {}, onItemSelect: () => {} },
};
export const LimitTwo: Story = {
  args: { onViewAll: () => {}, onItemSelect: () => {}, limit: 2 },
};
