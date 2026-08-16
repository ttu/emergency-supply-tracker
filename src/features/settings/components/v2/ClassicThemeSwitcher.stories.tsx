import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClassicThemeSwitcher } from './ClassicThemeSwitcher';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Settings/ClassicThemeSwitcher',
  component: ClassicThemeSwitcher,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onChange: { action: 'theme changed' } },
} satisfies Meta<typeof ClassicThemeSwitcher>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FromCockpit: Story = {
  args: { value: 'cockpit', onChange: () => {} },
};
export const FromLight: Story = {
  args: { value: 'light', onChange: () => {} },
};
