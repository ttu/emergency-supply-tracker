import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategorySelect } from './CategorySelect';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createCategoryId } from '@/shared/types';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';

const meta = {
  title: 'Design V2/Inventory/CategorySelect',
  component: CategorySelect,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <div style={{ width: 360 }}>
          <Story />
        </div>
      </DesignV2Story>
    ),
  ],
  argTypes: { onCategoryChange: { action: 'category changed' } },
} satisfies Meta<typeof CategorySelect>;
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
