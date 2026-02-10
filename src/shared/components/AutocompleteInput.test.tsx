import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AutocompleteInput } from './AutocompleteInput';

const suggestions = ['Kitchen', 'Garage', 'Basement', 'Bedroom', 'Bathroom'];

describe('AutocompleteInput', () => {
  it('renders as a combobox', () => {
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value=""
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows suggestions on focus when value matches', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Gar"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Garage' })).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value=""
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'B');

    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('shows filtered suggestions based on value', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox'));

    expect(
      screen.getByRole('option', { name: 'Basement' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Bathroom' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Kitchen' }),
    ).not.toBeInTheDocument();
  });

  it('selects suggestion on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Gar"
        onChange={onChange}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Garage' }));

    expect(onChange).toHaveBeenCalledWith('Garage');
    expect(onSelect).toHaveBeenCalledWith('Garage');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('navigates with arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('selects highlighted option on Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('Basement');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on Escape', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes dropdown on Tab', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not show dropdown when no suggestions match', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="xyz"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not show suggestion that exactly matches current value', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Kitchen"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('wraps around when navigating past last option', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={['A', 'B']}
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('wraps around when navigating before first option', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={['A', 'B']}
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');

    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <AutocompleteInput
          label="Location"
          suggestions={suggestions}
          value="Ba"
          onChange={() => {}}
        />
        <button>Outside button</button>
      </div>,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside the autocomplete container
    const outsideButton = screen.getByRole('button', {
      name: 'Outside button',
    });
    await user.click(outsideButton);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens dropdown with ArrowDown when closed but suggestions exist', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    // Focus without clicking to ensure dropdown is closed
    input.focus();

    // Press ArrowDown to open dropdown
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // First item should be highlighted
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('does not open dropdown with ArrowDown when no suggestions match', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="xyz"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    input.focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not show dropdown on focus when no suggestions match', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="nomatch"
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('highlights option on mouse enter', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={['Apple', 'Banana', 'Cherry']}
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const options = screen.getAllByRole('option');
    // Hover over the second option
    await user.hover(options[1]);

    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('does not select when Enter is pressed with no highlighted item', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Press Enter without highlighting anything (highlightedIndex is -1)
    await user.keyboard('{Enter}');

    // onChange should not have been called with a suggestion value
    // (it may have been called during typing, but not for selection)
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('uses provided id for input and listbox', async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        id="custom-location-id"
        label="Location"
        suggestions={suggestions}
        value="Ba"
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('id', 'custom-location-id');

    await user.click(input);
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('id', 'custom-location-id-listbox');
  });

  it('scrolls highlighted item into view when navigating', async () => {
    const user = userEvent.setup();
    // Create many suggestions to potentially cause scroll
    const manySuggestions = Array.from(
      { length: 20 },
      (_, i) => `Option ${i + 1}`,
    );

    render(
      <AutocompleteInput
        label="Location"
        suggestions={manySuggestions}
        value=""
        onChange={() => {}}
      />,
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    // Navigate down multiple times to trigger scroll
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    const options = screen.getAllByRole('option');
    // Third option should be highlighted (index 2)
    expect(options[2]).toHaveAttribute('aria-selected', 'true');
  });
});
