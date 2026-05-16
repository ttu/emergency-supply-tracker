import type { Meta, StoryObj } from '@storybook/react-vite';
import { KpiTile } from './KpiTile';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Dashboard/KpiTile',
  component: KpiTile,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof KpiTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'READINESS', value: 82, suffix: '%' },
};

export const CriticalTone: Story = {
  args: { label: 'CRITICAL', value: 4, tone: 'crit' },
};

export const WarnTone: Story = {
  args: { label: 'EXPIRING', value: 7, tone: 'warn' },
};

export const StringValue: Story = {
  args: { label: 'DAYS COVERED', value: '3.5' },
};

export const Civil: Story = {
  args: { label: 'READINESS', value: 60, suffix: '%' },
  decorators: [
    (Story) => (
      <DesignV2Story theme="civil">
        <Story />
      </DesignV2Story>
    ),
  ],
};

export const Pantry: Story = {
  args: { label: 'Readiness', value: 90, suffix: '%' },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
