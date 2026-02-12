import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { QuantityEditor } from './QuantityEditor';
import { renderWithProviders } from '@/test';
import { createQuantity } from '@/shared/types';

// Mock i18next
vi.mock('react-i18next', async () => {
  const actual =
    await vi.importActual<typeof import('react-i18next')>('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        if (key === 'liters') return 'liters';
        if (key === 'pieces') return 'pieces';
        if (key === 'common.save') return 'Save';
        if (key === 'common.cancel') return 'Cancel';
        if (key === 'inventory.quickEdit.fullEdit') return 'Full Edit';
        if (key === 'inventory.quickEdit.increase') return 'Increase quantity';
        if (key === 'inventory.quickEdit.decrease') return 'Decrease quantity';
        if (key === 'inventory.quickEdit.quantity') return 'Quantity';
        return key;
      },
    }),
  };
});

describe('QuantityEditor', () => {
  it('should render with initial quantity', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="liters"
        onQuantityChange={onQuantityChange}
      />,
    );

    expect(screen.getByTestId('quantity-input')).toHaveValue('5');
    expect(screen.getByText('liters')).toBeInTheDocument();
  });

  it('should increment quantity when + button is clicked', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const increaseButton = screen.getByTestId('quantity-increase');
    fireEvent.click(increaseButton);

    expect(screen.getByTestId('quantity-input')).toHaveValue('6');
  });

  it('should decrement quantity when - button is clicked', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const decreaseButton = screen.getByTestId('quantity-decrease');
    fireEvent.click(decreaseButton);

    expect(screen.getByTestId('quantity-input')).toHaveValue('4');
  });

  it('should not go below zero when decrementing', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(0)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const decreaseButton = screen.getByTestId('quantity-decrease');
    fireEvent.click(decreaseButton);

    expect(screen.getByTestId('quantity-input')).toHaveValue('0');
  });

  it('should call onQuantityChange when Save is clicked', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const increaseButton = screen.getByTestId('quantity-increase');
    fireEvent.click(increaseButton);

    const saveButton = screen.getByTestId('quantity-save');
    fireEvent.click(saveButton);

    expect(onQuantityChange).toHaveBeenCalledWith(6);
  });

  it('should call onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
        onCancel={onCancel}
      />,
    );

    const cancelButton = screen.getByTestId('quantity-cancel');
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it('should call onFullEdit when Full Edit is clicked', () => {
    const onFullEdit = vi.fn();
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
        onFullEdit={onFullEdit}
      />,
    );

    const fullEditButton = screen.getByTestId('quantity-full-edit');
    fireEvent.click(fullEditButton);

    expect(onFullEdit).toHaveBeenCalled();
    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it('should allow direct input of quantity', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.change(input, { target: { value: '10' } });

    expect(input).toHaveValue('10');
  });

  it('should handle decimal values when allowDecimal is true', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="kilograms"
        onQuantityChange={onQuantityChange}
        allowDecimal={true}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.change(input, { target: { value: '5.5' } });

    expect(input).toHaveValue('5.5');
  });

  it('should save quantity when Enter key is pressed', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onQuantityChange).toHaveBeenCalledWith(10);
  });

  it('should cancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalled();
    expect(onQuantityChange).not.toHaveBeenCalled();
  });

  it('should increment with ArrowUp key', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(input).toHaveValue('6');
  });

  it('should decrement with ArrowDown key', () => {
    const onQuantityChange = vi.fn();
    renderWithProviders(
      <QuantityEditor
        quantity={createQuantity(5)}
        unit="pieces"
        onQuantityChange={onQuantityChange}
      />,
    );

    const input = screen.getByTestId('quantity-input');
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(input).toHaveValue('4');
  });

  it('should stop propagation on container click', () => {
    const onQuantityChange = vi.fn();
    const onOuterClick = vi.fn();

    renderWithProviders(
      <div onClick={onOuterClick}>
        <QuantityEditor
          quantity={createQuantity(5)}
          unit="pieces"
          onQuantityChange={onQuantityChange}
        />
      </div>,
    );

    const editor = screen.getByTestId('quantity-editor');
    fireEvent.click(editor);

    // onOuterClick should not be called due to stopPropagation
    expect(onOuterClick).not.toHaveBeenCalled();
  });

  it('should stop propagation on container Enter key press', () => {
    const onQuantityChange = vi.fn();
    const onOuterKeyDown = vi.fn();

    renderWithProviders(
      <div onKeyDown={onOuterKeyDown}>
        <QuantityEditor
          quantity={createQuantity(5)}
          unit="pieces"
          onQuantityChange={onQuantityChange}
        />
      </div>,
    );

    const editor = screen.getByTestId('quantity-editor');
    fireEvent.keyDown(editor, { key: 'Enter' });

    // onOuterKeyDown should not be called due to stopPropagation
    expect(onOuterKeyDown).not.toHaveBeenCalled();
  });

  it('should stop propagation on container Space key press', () => {
    const onQuantityChange = vi.fn();
    const onOuterKeyDown = vi.fn();

    renderWithProviders(
      <div onKeyDown={onOuterKeyDown}>
        <QuantityEditor
          quantity={createQuantity(5)}
          unit="pieces"
          onQuantityChange={onQuantityChange}
        />
      </div>,
    );

    const editor = screen.getByTestId('quantity-editor');
    fireEvent.keyDown(editor, { key: ' ' });

    // onOuterKeyDown should not be called due to stopPropagation
    expect(onOuterKeyDown).not.toHaveBeenCalled();
  });

  it('should not stop propagation for other keys', () => {
    const onQuantityChange = vi.fn();
    const onOuterKeyDown = vi.fn();

    renderWithProviders(
      <div onKeyDown={onOuterKeyDown}>
        <QuantityEditor
          quantity={createQuantity(5)}
          unit="pieces"
          onQuantityChange={onQuantityChange}
        />
      </div>,
    );

    const editor = screen.getByTestId('quantity-editor');
    fireEvent.keyDown(editor, { key: 'a' });

    // onOuterKeyDown should be called for other keys
    expect(onOuterKeyDown).toHaveBeenCalled();
  });
});
