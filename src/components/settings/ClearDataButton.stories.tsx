import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClearDataButton } from './ClearDataButton';

const meta = {
  title: 'Settings/ClearDataButton',
  component: ClearDataButton,
} satisfies Meta<typeof ClearDataButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
