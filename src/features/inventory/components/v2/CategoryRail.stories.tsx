import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryRail } from './CategoryRail';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createCategoryId } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const meta = {
  title: 'Design V2/Inventory/CategoryRail',
  component: CategoryRail,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <div style={{ width: 232 }}>
          <Story />
        </div>
      </DesignV2Story>
    ),
  ],
  argTypes: { onCategoryChange: { action: 'category changed' } },
} satisfies Meta<typeof CategoryRail>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = (categoryId: string): DesignItemRow =>
  ({
    item: createMockInventoryItem({ categoryId: createCategoryId(categoryId) }),
    status: 'ok',
    categoryCode: 'X',
    recommended: 1,
  }) as unknown as DesignItemRow;

const rows = [
  ...Array.from({ length: 6 }, () => row('water-beverages')),
  ...Array.from({ length: 14 }, () => row('food')),
  ...Array.from({ length: 3 }, () => row('medical-health')),
];

const base = {
  categories: [...STANDARD_CATEGORIES],
  rows,
  onCategoryChange: () => {},
};

export const NothingSelected: Story = { args: base };
export const CategorySelected: Story = {
  args: { ...base, selectedCategoryId: 'food' },
};
/** An empty inventory still lists every category, all reading zero. */
export const EmptyInventory: Story = { args: { ...base, rows: [] } };
