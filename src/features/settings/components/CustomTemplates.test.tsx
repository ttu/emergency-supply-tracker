import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomTemplates } from './CustomTemplates';
import { createProductTemplateId } from '@/shared/types';

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'settings.customTemplates.empty': 'No custom templates',
        'settings.customTemplates.hint':
          "Create templates by checking 'Save as template' when adding custom items.",
        'settings.customTemplates.description': `You have ${options?.count || 0} custom template(s).`,
        'common.delete': 'Delete',
        food: 'Food',
        'water-beverages': 'Water & Beverages',
        'units.pieces': 'pieces',
        'units.liters': 'liters',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock the inventory hook
const mockDeleteCustomTemplate = vi.fn();
const mockCustomTemplates = [
  {
    id: createProductTemplateId('template-1'),
    name: 'My Custom Item',
    category: 'food',
    defaultUnit: 'pieces',
    isBuiltIn: false,
    isCustom: true,
  },
  {
    id: createProductTemplateId('template-2'),
    name: 'Water Bottle',
    category: 'water-beverages',
    defaultUnit: 'liters',
    isBuiltIn: false,
    isCustom: true,
  },
];

vi.mock('@/features/inventory', () => ({
  useInventory: () => ({
    customTemplates: mockCustomTemplates,
    deleteCustomTemplate: mockDeleteCustomTemplate,
  }),
}));

describe('CustomTemplates', () => {
  beforeEach(() => {
    mockDeleteCustomTemplate.mockClear();
  });

  it('should render list of custom templates', () => {
    render(<CustomTemplates />);

    expect(screen.getByText('My Custom Item')).toBeInTheDocument();
    expect(screen.getByText('Water Bottle')).toBeInTheDocument();
  });

  it('should show description with count', () => {
    render(<CustomTemplates />);

    expect(screen.getByText(/You have 2 custom template/)).toBeInTheDocument();
  });

  it('should show category for each template', () => {
    render(<CustomTemplates />);

    expect(screen.getByText(/Food/)).toBeInTheDocument();
    expect(screen.getByText(/Water & Beverages/)).toBeInTheDocument();
  });

  it('should show unit for each template', () => {
    render(<CustomTemplates />);

    expect(screen.getByText('pieces')).toBeInTheDocument();
    expect(screen.getByText('liters')).toBeInTheDocument();
  });

  it('should call deleteCustomTemplate when clicking delete button', () => {
    render(<CustomTemplates />);

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockDeleteCustomTemplate).toHaveBeenCalledTimes(1);
    expect(mockDeleteCustomTemplate).toHaveBeenCalledWith(
      mockCustomTemplates[0].id,
    );
  });

  it('should have delete buttons with accessible labels', () => {
    render(<CustomTemplates />);

    expect(
      screen.getByRole('button', { name: 'Delete: My Custom Item' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete: Water Bottle' }),
    ).toBeInTheDocument();
  });
});

describe('CustomTemplates with no templates', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should show empty message when no templates exist', async () => {
    // Re-mock with empty array
    vi.doMock('@/features/inventory', () => ({
      useInventory: () => ({
        customTemplates: [],
        deleteCustomTemplate: vi.fn(),
      }),
    }));

    // Re-import the component after changing the mock
    const { CustomTemplates: EmptyCustomTemplates } =
      await import('./CustomTemplates');

    render(<EmptyCustomTemplates />);

    expect(screen.getByText('No custom templates')).toBeInTheDocument();
    expect(
      screen.getByText(/Create templates by checking/),
    ).toBeInTheDocument();
  });
});
