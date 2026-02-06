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
});
