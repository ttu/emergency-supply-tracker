import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alerts } from './Alerts';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Alerts/Alerts',
  component: Alerts,
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
    onCategorySelect: { action: 'category selected' },
  },
} satisfies Meta<typeof Alerts>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  args: { onItemSelect: () => {}, onCategorySelect: () => {} },
};
export const Pantry: Story = {
  args: { onItemSelect: () => {}, onCategorySelect: () => {} },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
