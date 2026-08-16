import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsRail } from './SettingsRail';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const sections = [
  { id: 'appearance', code: '01', label: 'APPEARANCE' },
  { id: 'household', code: '02', label: 'HOUSEHOLD' },
  { id: 'nutrition', code: '04', label: 'NUTRITION' },
  { id: 'danger', code: '11', label: 'DANGER ZONE', danger: true },
];

const meta = {
  title: 'Design V2/Settings/SettingsRail',
  component: SettingsRail,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onSelect: { action: 'select' } },
} satisfies Meta<typeof SettingsRail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { sections, activeSection: 'appearance', onSelect: () => {} },
};
export const DangerActive: Story = {
  args: { sections, activeSection: 'danger', onSelect: () => {} },
};
