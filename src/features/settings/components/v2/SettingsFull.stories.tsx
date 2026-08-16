import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsFull } from './SettingsFull';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Settings/SettingsFull',
  component: SettingsFull,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof SettingsFull>;
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
