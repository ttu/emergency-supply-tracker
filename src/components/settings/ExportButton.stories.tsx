import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExportButton } from './ExportButton';

const meta = {
  title: 'Settings/ExportButton',
  component: ExportButton,
} satisfies Meta<typeof ExportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
