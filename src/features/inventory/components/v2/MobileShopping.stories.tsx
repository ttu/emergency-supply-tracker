import type { Meta, StoryObj } from '@storybook/react-vite';
import { MobileShopping } from './MobileShopping';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Inventory/MobileShopping',
  component: MobileShopping,
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
} satisfies Meta<typeof MobileShopping>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
