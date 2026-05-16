import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiTile } from './KpiTile';

describe('KpiTile (v2)', () => {
  it('renders label and numeric value', () => {
    render(<KpiTile label="READINESS" value={82} suffix="%" />);
    expect(screen.getByText('READINESS')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders string values verbatim', () => {
    render(<KpiTile label="DAYS COVERED" value="3.5" />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('renders supporting children below the number', () => {
    render(
      <KpiTile label="CRITICAL" value={4}>
        <div data-testid="kpi-sub">action required</div>
      </KpiTile>,
    );
    expect(screen.getByTestId('kpi-sub')).toHaveTextContent('action required');
  });
});
