import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductPicker } from './ProductPicker';
import { DesignV2Story } from '@/shared/components/design-v2/storybook';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { createMockProductTemplate } from '@/shared/utils/test/factories';
import { createProductTemplateId } from '@/shared/types';

const meta = {
  title: 'Design V2/Inventory/ProductPicker',
  component: ProductPicker,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DesignV2Story>
        <Story />
      </DesignV2Story>
    ),
  ],
  argTypes: {
    onSelectTemplate: { action: 'template selected' },
    onSelectCustomTemplate: { action: 'custom template selected' },
    onSelectCustom: { action: 'custom item' },
  },
} satisfies Meta<typeof ProductPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  templates: RECOMMENDED_ITEMS,
  customTemplates: [],
  categories: [...STANDARD_CATEGORIES],
  onSelectTemplate: () => {},
  onSelectCustomTemplate: () => {},
  onSelectCustom: () => {},
};

export const AllProducts: Story = { args: base };

export const OneCategory: Story = {
  args: { ...base, initialCategoryId: 'water-beverages' },
};

export const WithOwnTemplates: Story = {
  args: {
    ...base,
    customTemplates: [
      createMockProductTemplate({
        id: createProductTemplateId('sourdough-starter'),
        name: 'Sourdough Starter',
        category: 'food',
        isCustom: true,
      }),
    ],
  },
};

/** Nothing on offer — the custom branch is the way forward. */
export const Empty: Story = { args: { ...base, templates: [] } };
