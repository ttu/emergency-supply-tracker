import type { Meta, StoryObj } from '@storybook/react-vite';
import { LanguageSelector } from './LanguageSelector';
import { SettingsProvider } from '@/shared/contexts/SettingsProvider';

const meta = {
  title: 'Settings/LanguageSelector',
  component: LanguageSelector,
  decorators: [
    (Story) => (
      <SettingsProvider>
        <Story />
      </SettingsProvider>
    ),
  ],
} satisfies Meta<typeof LanguageSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
