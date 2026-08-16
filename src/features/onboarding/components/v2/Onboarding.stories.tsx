import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesignOnboarding } from './Onboarding';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Onboarding',
  component: DesignOnboarding,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onComplete: { action: 'complete' } },
} satisfies Meta<typeof DesignOnboarding>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = { args: { onComplete: () => {} } };
export const Pantry: Story = {
  args: { onComplete: () => {} },
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};
