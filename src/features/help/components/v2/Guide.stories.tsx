import type { Meta, StoryObj } from '@storybook/react-vite';
import { Guide } from './Guide';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Help/Guide',
  component: Guide,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof Guide>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
export const Civil: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="civil">
        <Story />
      </DesignV2Story>
    ),
  ],
};
export const Pantry: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
