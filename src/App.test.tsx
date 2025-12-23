import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText(/Emergency Supply Tracker/i)).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<App />);
    expect(screen.getByText(/72 Hour Preparedness/i)).toBeInTheDocument();
  });
});
