import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverageMatrix } from './CoverageMatrix';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Dashboard/CoverageMatrix',
  component: CoverageMatrix,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onCategorySelect: { action: 'category selected' } },
} satisfies Meta<typeof CoverageMatrix>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = { args: { onCategorySelect: () => {} } };
export const Pantry: Story = {
  args: { onCategorySelect: () => {} },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
