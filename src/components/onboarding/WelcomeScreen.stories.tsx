import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelcomeScreen } from './WelcomeScreen';
import { SettingsProvider } from '../../contexts/SettingsProvider';

const meta = {
  title: 'Onboarding/WelcomeScreen',
  component: WelcomeScreen,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof WelcomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onContinue: () => {
      console.log('Continue to next step');
    },
  },
};

export const Interactive: Story = {
  args: {
    onContinue: () => {
      alert('Proceeding to household setup...');
    },
  },
};
