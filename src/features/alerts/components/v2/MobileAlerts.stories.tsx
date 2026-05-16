import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileAlerts } from './MobileAlerts';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Alerts/MobileAlerts',
  component: MobileAlerts,
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
    onCategorySelect: { action: 'category selected' },
  },
} satisfies Meta<typeof MobileAlerts>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  args: { onItemSelect: () => {}, onCategorySelect: () => {} },
};
