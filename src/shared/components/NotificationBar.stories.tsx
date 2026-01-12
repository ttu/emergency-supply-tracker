import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { NotificationBar } from './NotificationBar';
import { NotificationProvider } from '../contexts/NotificationProvider';
import { useNotification } from '../hooks/useNotification';
import { Button } from './Button';

// Wrapper component that provides notification context and demo controls
function NotificationBarDemo() {
  const { showNotification } = useNotification();

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <Button
          onClick={() =>
            showNotification('Item "Water Bottle" added', 'success')
          }
        >
          Show Success
        </Button>
        <Button
          onClick={() =>
            showNotification('Item "Batteries" updated', 'success')
          }
        >
          Show Update
        </Button>
        <Button
          onClick={() =>
            showNotification('Item "First Aid Kit" deleted', 'info')
          }
        >
          Show Delete
        </Button>
        <Button
          onClick={() => showNotification('Failed to save item', 'error')}
        >
          Show Error
        </Button>
        <Button
          onClick={() => {
            showNotification('First notification', 'success');
            setTimeout(
              () => showNotification('Second notification', 'info'),
              200,
            );
            setTimeout(
              () => showNotification('Third notification', 'error'),
              400,
            );
          }}
        >
          Show Multiple
        </Button>
      </div>
      <NotificationBar />
    </div>
  );
}

const meta = {
  title: 'Common/NotificationBar',
  component: NotificationBar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story: () => ReactElement) => (
      <NotificationProvider>
        <Story />
      </NotificationProvider>
    ),
  ],
} satisfies Meta<typeof NotificationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <NotificationBarDemo />,
};

export const SingleNotification: Story = {
  render: () => {
    function SingleDemo() {
      const { showNotification } = useNotification();
      return (
        <div style={{ padding: '2rem' }}>
          <Button
            onClick={() =>
              showNotification('Item "Water Bottle" added', 'success')
            }
          >
            Show Notification
          </Button>
          <NotificationBar />
        </div>
      );
    }
    return (
      <NotificationProvider>
        <SingleDemo />
      </NotificationProvider>
    );
  },
};

export const MultipleNotifications: Story = {
  render: () => {
    function MultipleDemo() {
      const { showNotification } = useNotification();
      return (
        <div style={{ padding: '2rem' }}>
          <Button
            onClick={() => {
              showNotification('Item "Water Bottle" added', 'success');
              setTimeout(
                () => showNotification('Item "Batteries" updated', 'success'),
                200,
              );
              setTimeout(
                () => showNotification('Item "First Aid Kit" deleted', 'info'),
                400,
              );
            }}
          >
            Show Multiple Notifications
          </Button>
          <NotificationBar />
        </div>
      );
    }
    return (
      <NotificationProvider>
        <MultipleDemo />
      </NotificationProvider>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    function VariantsDemo() {
      const { showNotification } = useNotification();
      return (
        <div style={{ padding: '2rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '2rem',
            }}
          >
            <Button
              onClick={() =>
                showNotification('Success notification', 'success')
              }
            >
              Success
            </Button>
            <Button
              onClick={() => showNotification('Info notification', 'info')}
            >
              Info
            </Button>
            <Button
              onClick={() => showNotification('Error notification', 'error')}
            >
              Error
            </Button>
          </div>
          <NotificationBar />
        </div>
      );
    }
    return (
      <NotificationProvider>
        <VariantsDemo />
      </NotificationProvider>
    );
  },
};
