import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GitHubIcon, GITHUB_PATH } from './GitHubIcon';
import styles from './GitHubIcon.module.css';

describe('GitHubIcon', () => {
  it('renders an SVG in the document', () => {
    render(<GitHubIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders path with GITHUB_PATH as d attribute', () => {
    render(<GitHubIcon />);
    const path = document.querySelector('svg path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', GITHUB_PATH);
  });

  it('applies className when provided', () => {
    render(<GitHubIcon className={styles.small} />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass(styles.small);
  });

  it('applies custom className', () => {
    render(<GitHubIcon className="custom-class" />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });
});
