import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep05Kit } from './OnboardStep05Kit';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step05Kit',
  component: OnboardStep05Kit,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof OnboardStep05Kit>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onNext: () => {}, onBack: () => {} },
};
