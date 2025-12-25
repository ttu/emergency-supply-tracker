import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdvancedFeatures } from './AdvancedFeatures';
import { SettingsProvider } from '../../contexts/SettingsProvider';

const meta = {
  title: 'Settings/AdvancedFeatures',
  component: AdvancedFeatures,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof AdvancedFeatures>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
