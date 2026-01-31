import type { Meta, StoryObj } from '@storybook/react-vite';
import { GitHubIcon } from './GitHubIcon';
import styles from './GitHubIcon.module.css';

const meta = {
  title: 'Common/GitHubIcon',
  component: GitHubIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional CSS class for sizing (e.g. from CSS Module)',
    },
  },
} satisfies Meta<typeof GitHubIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    className: styles.small,
  },
};

export const Large: Story = {
  args: {
    className: styles.large,
  },
};
