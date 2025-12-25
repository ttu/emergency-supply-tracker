import { render, screen, fireEvent } from '@testing-library/react';
import { Help } from './Help';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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

  it('should toggle topic expansion on click', () => {
    render(<Help />);

    const topicButton = screen.getByText('help.gettingStarted.question');

    // Initially collapsed
    expect(
      screen.queryByText('help.gettingStarted.answer'),
    ).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(topicButton);
    expect(screen.getByText('help.gettingStarted.answer')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(topicButton);
    expect(
      screen.queryByText('help.gettingStarted.answer'),
    ).not.toBeInTheDocument();
  });

  it('should collapse previous topic when opening new one', () => {
    render(<Help />);

    const topic1Button = screen.getByText('help.gettingStarted.question');
    const topic2Button = screen.getByText('help.householdSize.question');

    // Expand first topic
    fireEvent.click(topic1Button);
    expect(screen.getByText('help.gettingStarted.answer')).toBeInTheDocument();

    // Expand second topic
    fireEvent.click(topic2Button);
    expect(screen.getByText('help.householdSize.answer')).toBeInTheDocument();
    expect(
      screen.queryByText('help.gettingStarted.answer'),
    ).not.toBeInTheDocument();
  });

  it('should set correct aria-expanded attribute', () => {
    render(<Help />);

    const topicButton = screen.getByText('help.gettingStarted.question');

    // Initially collapsed
    expect(topicButton.closest('button')).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    // Expanded
    fireEvent.click(topicButton);
    expect(topicButton.closest('button')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
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
