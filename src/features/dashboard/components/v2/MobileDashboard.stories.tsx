import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileDashboard } from './MobileDashboard';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Dashboard/MobileDashboard',
  component: MobileDashboard,
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
    onCategorySelect: { action: 'category selected' },
    onItemSelect: { action: 'item selected' },
    onAddItem: { action: 'add item' },
    onViewInventory: { action: 'view inventory' },
  },
} satisfies Meta<typeof MobileDashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  args: {
    onCategorySelect: () => {},
    onItemSelect: () => {},
    onAddItem: () => {},
    onViewInventory: () => {},
  },
};
