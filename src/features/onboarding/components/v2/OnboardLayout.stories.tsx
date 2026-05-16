import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardLayout } from './OnboardLayout';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

const meta = {
  title: 'Design V2/Onboarding/OnboardLayout',
  component: OnboardLayout,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onContinue: { action: 'continue' },
    back: { action: 'back' },
  },
} satisfies Meta<typeof OnboardLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Step2NoSide: Story = {
  args: {
    step: 2,
    title: 'TITLE',
    lead: { title: 'LEAD', sub: 'OPTIONAL SUB-LEAD COPY' },
    onContinue: () => {},
    back: () => {},
  },
};
export const Step1NoBack: Story = {
  args: {
    step: 1,
    title: 'WELCOME',
    lead: { title: 'BEGIN', sub: 'No back, no aside' },
    onContinue: () => {},
  },
};
export const WithAside: Story = {
  args: {
    step: 3,
    title: 'WITH SIDE',
    lead: { title: 'LAYOUT WITH ASIDE' },
    side: <div>Side content goes here</div>,
    onContinue: () => {},
    back: () => {},
  },
};
