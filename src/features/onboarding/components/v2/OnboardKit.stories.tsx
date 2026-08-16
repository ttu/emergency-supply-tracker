import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardKit } from './OnboardKit';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Kit',
  component: OnboardKit,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof OnboardKit>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onNext: () => {}, onBack: () => {} },
};
