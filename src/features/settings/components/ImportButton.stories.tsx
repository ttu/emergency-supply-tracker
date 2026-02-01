import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportButton } from './ImportButton';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';

const meta = {
  title: 'Settings/ImportButton',
  component: ImportButton,
  decorators: [
    (Story) => (
      <NotificationProvider>
        <Story />
      </NotificationProvider>
    ),
  ],
} satisfies Meta<typeof ImportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
