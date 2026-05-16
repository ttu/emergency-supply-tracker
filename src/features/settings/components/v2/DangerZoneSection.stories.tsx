import type { Meta, StoryObj } from '@storybook/react-vite';
import { DangerZoneSection } from './DangerZoneSection';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Settings/Sections/DangerZoneSection',
  component: DangerZoneSection,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof DangerZoneSection>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {};
export const Pantry: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
