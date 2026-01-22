import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KitCard } from './KitCard';
import type { KitInfo } from '@/shared/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; name?: string }) => {
      if (key === 'kits.itemCount') return `${options?.count} items`;
      if (key === 'kits.deleteKit') return `Delete ${options?.name}`;
      return key;
    },
  }),
}));

describe('KitCard', () => {
  const mockBuiltInKit: KitInfo = {
    id: '72tuntia-standard',
    name: 'Standard Kit',
    description: 'A standard emergency kit',
    itemCount: 50,
    isBuiltIn: true,
  };

  const mockCustomKit: KitInfo = {
    id: 'custom:abc123',
    name: 'My Custom Kit',
    description: 'Custom kit for my family',
    itemCount: 25,
    isBuiltIn: false,
  };

  it('should render kit name and item count', () => {
    render(<KitCard kit={mockBuiltInKit} />);

    expect(screen.getByText('Standard Kit')).toBeInTheDocument();
    expect(screen.getByText('50 items')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<KitCard kit={mockBuiltInKit} />);

    expect(screen.getByText('A standard emergency kit')).toBeInTheDocument();
  });

  it('should show built-in badge for built-in kits', () => {
    render(<KitCard kit={mockBuiltInKit} />);

    expect(screen.getByTestId('built-in-badge')).toBeInTheDocument();
  });

  it('should not show built-in badge for custom kits', () => {
    render(<KitCard kit={mockCustomKit} />);

    expect(screen.queryByTestId('built-in-badge')).not.toBeInTheDocument();
  });

  it('should apply selected styling when isSelected is true', () => {
    render(<KitCard kit={mockBuiltInKit} isSelected={true} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    // CSS Modules mangles class names, so check for the partial match
    expect(card.className).toMatch(/selected/);
  });

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<KitCard kit={mockBuiltInKit} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId('kit-card-72tuntia-standard'));

    expect(onSelect).toHaveBeenCalledWith(mockBuiltInKit);
  });

  it('should call onSelect when Enter key is pressed', () => {
    const onSelect = vi.fn();
    render(<KitCard kit={mockBuiltInKit} onSelect={onSelect} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(mockBuiltInKit);
  });

  it('should call onSelect when Space key is pressed', () => {
    const onSelect = vi.fn();
    render(<KitCard kit={mockBuiltInKit} onSelect={onSelect} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledWith(mockBuiltInKit);
  });

  it('should not call onSelect for other keys', () => {
    const onSelect = vi.fn();
    render(<KitCard kit={mockBuiltInKit} onSelect={onSelect} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    fireEvent.keyDown(card, { key: 'Tab' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should show delete button for custom kits when showActions is true', () => {
    const onDelete = vi.fn();
    render(
      <KitCard kit={mockCustomKit} showActions={true} onDelete={onDelete} />,
    );

    expect(screen.getByTestId('delete-kit-custom:abc123')).toBeInTheDocument();
  });

  it('should not show delete button for built-in kits', () => {
    const onDelete = vi.fn();
    render(
      <KitCard kit={mockBuiltInKit} showActions={true} onDelete={onDelete} />,
    );

    expect(
      screen.queryByTestId('delete-kit-72tuntia-standard'),
    ).not.toBeInTheDocument();
  });

  it('should not show delete button when showActions is false', () => {
    const onDelete = vi.fn();
    render(
      <KitCard kit={mockCustomKit} showActions={false} onDelete={onDelete} />,
    );

    expect(
      screen.queryByTestId('delete-kit-custom:abc123'),
    ).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    const onSelect = vi.fn();
    render(
      <KitCard
        kit={mockCustomKit}
        showActions={true}
        onDelete={onDelete}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByTestId('delete-kit-custom:abc123'));

    expect(onDelete).toHaveBeenCalledWith(mockCustomKit);
    // Should not trigger select
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should render without description', () => {
    const kitWithoutDescription: KitInfo = {
      id: 'custom:minimal',
      name: 'Minimal Kit',
      itemCount: 10,
      isBuiltIn: false,
    };

    render(<KitCard kit={kitWithoutDescription} />);

    expect(screen.getByText('Minimal Kit')).toBeInTheDocument();
    expect(screen.getByText('10 items')).toBeInTheDocument();
  });

  it('should have correct role and tabIndex when selectable', () => {
    const onSelect = vi.fn();
    render(<KitCard kit={mockBuiltInKit} onSelect={onSelect} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should not have button role when not selectable', () => {
    render(<KitCard kit={mockBuiltInKit} />);

    const card = screen.getByTestId('kit-card-72tuntia-standard');
    expect(card).not.toHaveAttribute('role', 'button');
  });
});
