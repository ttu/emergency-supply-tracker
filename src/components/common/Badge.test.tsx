import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Content</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender, container } = render(
      <Badge variant="default">Default</Badge>,
    );
    let badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge variant="warning">Warning</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge variant="danger">Danger</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge variant="info">Info</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender, container } = render(<Badge size="small">Small</Badge>);
    let badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge size="medium">Medium</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();

    rerender(<Badge size="large">Large</Badge>);
    badge = container.firstChild as HTMLElement;
    expect(badge).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom">Content</Badge>);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('custom');
  });

  it('forwards HTML attributes', () => {
    render(
      <Badge data-testid="test-badge" aria-label="status">
        Content
      </Badge>,
    );
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('aria-label', 'status');
  });
});
