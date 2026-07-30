import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dashboard } from './Dashboard';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Dashboard/Dashboard',
  component: Dashboard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onCategorySelect: { action: 'category selected' },
    onViewAllPriority: { action: 'view all priority' },
    onItemSelect: { action: 'item selected' },
  },
} satisfies Meta<typeof Dashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  onCategorySelect: () => {},
  onViewAllPriority: () => {},
  onItemSelect: () => {},
};

export const Cockpit: Story = { args };
export const Civil: Story = {
  args,
  decorators: [
    (Story) => (
      <DesignV2Story theme="civil">
        <Story />
      </DesignV2Story>
    ),
  ],
};
export const Pantry: Story = {
  args,
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
