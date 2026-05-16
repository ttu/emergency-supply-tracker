import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep02Theme } from './OnboardStep02Theme';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step02Theme',
  component: OnboardStep02Theme,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onNext: { action: 'next' }, onBack: { action: 'back' } },
} satisfies Meta<typeof OnboardStep02Theme>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = { args: { onNext: () => {}, onBack: () => {} } };
