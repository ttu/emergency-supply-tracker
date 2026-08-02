import type { Meta, StoryObj } from '@storybook/react-vite';
import { OnboardStep07Complete } from './OnboardStep07Complete';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';

const meta = {
  title: 'Design V2/Onboarding/Step07Complete',
  component: OnboardStep07Complete,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
} satisfies Meta<typeof OnboardStep07Complete>;
export default meta;
type Story = StoryObj<typeof meta>;

const household = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 7,
  useFreezer: false,
};

const toAcquire = Array.from({ length: 12 }, () =>
  createMockInventoryItem({ quantity: createQuantity(0) }),
);

export const NothingStockedYet: Story = {
  args: { household, items: toAcquire, onComplete: () => {} },
};

export const SomeAlreadyOwned: Story = {
  args: {
    household,
    items: [
      ...toAcquire,
      ...Array.from({ length: 6 }, () =>
        createMockInventoryItem({ quantity: createQuantity(4) }),
      ),
    ],
    onComplete: () => {},
  },
};

export const SkippedTheList: Story = {
  args: { household, items: [], onComplete: () => {} },
};
