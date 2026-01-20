import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Help } from './Help';

// Mock i18next
vi.mock('react-i18next', async () => {
  const { defaultI18nMock } = await import('@/test/i18n');
  return defaultI18nMock;
});

describe('Help', () => {
  it('should render page title', () => {
    render(<Help />);
    expect(screen.getByText('help.title')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    render(<Help />);
    expect(screen.getByText('help.subtitle')).toBeInTheDocument();
  });

  it('should render FAQ section', () => {
    render(<Help />);
    expect(screen.getByText('help.faqTitle')).toBeInTheDocument();
  });

  it('should render all FAQ topics', () => {
    render(<Help />);
    expect(
      screen.getByText('help.gettingStarted.question'),
    ).toBeInTheDocument();
    expect(screen.getByText('help.householdSize.question')).toBeInTheDocument();
    expect(
      screen.getByText('help.recommendedItems.question'),
    ).toBeInTheDocument();
  });

  it('should render all FAQ answers as always visible', () => {
    render(<Help />);
    expect(screen.getByText('help.gettingStarted.answer')).toBeInTheDocument();
    expect(screen.getByText('help.householdSize.answer')).toBeInTheDocument();
    expect(
      screen.getByText('help.recommendedItems.answer'),
    ).toBeInTheDocument();
  });

  it('should render question mark icons', () => {
    render(<Help />);
    const questionIcons = screen.getAllByText('?');
    expect(questionIcons.length).toBeGreaterThan(0);
  });

  it('should render quick tips section', () => {
    render(<Help />);
    expect(screen.getByText('help.quickTipsTitle')).toBeInTheDocument();
    expect(screen.getByText('help.tips.tip1')).toBeInTheDocument();
    expect(screen.getByText('help.tips.tip2')).toBeInTheDocument();
  });

  it('should render contact section with GitHub link', () => {
    render(<Help />);
    expect(screen.getByText('help.contactTitle')).toBeInTheDocument();
    expect(screen.getByText('help.contactText')).toBeInTheDocument();

    const link = screen.getByText('help.githubLink');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
