import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClearDataButton } from './ClearDataButton';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';

const meta = {
  title: 'Settings/ClearDataButton',
  component: ClearDataButton,
  decorators: [
    (Story) => (
      <NotificationProvider>
        <Story />
      </NotificationProvider>
    ),
  ],
} satisfies Meta<typeof ClearDataButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
