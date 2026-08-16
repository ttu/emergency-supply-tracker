import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemePicker } from './ThemePicker';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Settings/ThemePicker',
  component: ThemePicker,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onChange: { action: 'theme changed' } },
} satisfies Meta<typeof ThemePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CockpitSelected: Story = {
  args: { value: 'cockpit', onChange: () => {} },
};
export const CivilSelected: Story = {
  args: { value: 'civil', onChange: () => {} },
};
export const PantrySelected: Story = {
  args: { value: 'pantry', onChange: () => {} },
};
export const ListLayout: Story = {
  args: { value: 'cockpit', onChange: () => {}, layout: 'list' },
};
