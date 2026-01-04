import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImportButton } from './ImportButton';

const meta = {
  title: 'Settings/ImportButton',
  component: ImportButton,
} satisfies Meta<typeof ImportButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
