import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep01Welcome } from './OnboardStep01Welcome';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/Step01Welcome',
  component: OnboardStep01Welcome,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: { onNext: { action: 'next' } },
} satisfies Meta<typeof OnboardStep01Welcome>;
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
