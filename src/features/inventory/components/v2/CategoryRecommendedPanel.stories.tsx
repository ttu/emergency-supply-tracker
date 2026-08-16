import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryRecommendedPanel } from './CategoryRecommendedPanel';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';

/**
 * The story inventory is empty, so every recommended product in the category
 * is short — which is what makes the panel worth looking at. It renders
 * collapsed, as it does in the app; click the header to expand the rows and
 * see the three quick actions.
 */
const meta = {
  title: 'Design V2/Inventory/CategoryRecommendedPanel',
  component: CategoryRecommendedPanel,
  parameters: { layout: 'padded' },
  args: {
    categoryId: 'water-beverages',
    onAdd: () => {},
  },
} satisfies Meta<typeof CategoryRecommendedPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Cockpit: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="cockpit">
        <Story />
      </DesignV2Story>
    ),
  ],
};

export const CivilDefense: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="civil">
        <Story />
      </DesignV2Story>
    ),
  ],
};

export const Pantry: Story = {
  decorators: [
    (Story) => (
      <DesignV2Story theme="pantry">
        <Story />
      </DesignV2Story>
    ),
  ],
};

/** A category with more shortages, to show the list at length. */
export const ManyShortages: Story = {
  args: { categoryId: 'food' },
  decorators: [
    (Story) => (
      <DesignV2Story theme="cockpit">
        <Story />
      </DesignV2Story>
    ),
  ],
};
