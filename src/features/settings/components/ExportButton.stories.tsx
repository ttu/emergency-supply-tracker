import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExportButton } from './ExportButton';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';

const meta = {
  title: 'Settings/ExportButton',
  component: ExportButton,
  decorators: [
    (Story) => (
      <NotificationProvider>
        <Story />
      </NotificationProvider>
    ),
  ],
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
