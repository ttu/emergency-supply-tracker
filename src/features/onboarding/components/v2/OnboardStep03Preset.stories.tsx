import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep03Preset } from './OnboardStep03Preset';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step03Preset',
  component: OnboardStep03Preset,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onPresetChange: { action: 'preset changed' },
    onApplyPreset: { action: 'apply preset' },
    onNext: { action: 'next' },
    onBack: { action: 'back' },
  },
} satisfies Meta<typeof OnboardStep03Preset>;
export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  presetCode: 'P-02',
  onPresetChange: () => {},
  onApplyPreset: () => {},
  onNext: () => {},
  onBack: () => {},
};

export const Couple: Story = { args };
export const Family: Story = { args: { ...args, presetCode: 'P-03' } };
export const Custom: Story = { args: { ...args, presetCode: 'P-04' } };
