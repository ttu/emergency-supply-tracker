import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardWelcome } from './OnboardWelcome';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Welcome',
  component: OnboardWelcome,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onNext: { action: 'next' } },
} satisfies Meta<typeof OnboardWelcome>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = { args: { onNext: () => {} } };
export const Pantry: Story = {
  args: { onNext: () => {} },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
