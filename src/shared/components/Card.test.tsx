import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders with children', () => {
    render(
      <Card>
        <div>Test content</div>
      </Card>,
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender, container } = render(
      <Card variant="default">Default</Card>,
    );
    let card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    rerender(<Card variant="outlined">Outlined</Card>);
    card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    rerender(<Card variant="elevated">Elevated</Card>);
    card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });

  it('renders different padding sizes', () => {
    const { rerender, container } = render(<Card padding="none">None</Card>);
    let card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    rerender(<Card padding="small">Small</Card>);
    card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    rerender(<Card padding="medium">Medium</Card>);
    card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    rerender(<Card padding="large">Large</Card>);
    card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom');
  });

  it('forwards HTML attributes', () => {
    render(
      <Card data-testid="test-card" role="article">
        Content
      </Card>,
    );
    const card = screen.getByTestId('test-card');
    expect(card).toHaveAttribute('role', 'article');
  });
});
