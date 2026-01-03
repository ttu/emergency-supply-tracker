import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from './ExportButton';
import * as localStorage from '@/shared/utils/storage/localStorage';
import { createMockAppData } from '@/shared/utils/test/factories';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock localStorage utilities
jest.mock('@/shared/utils/storage/localStorage');

describe('ExportButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  it('should render export button', () => {
    render(<ExportButton />);

    expect(screen.getByText('settings.export.button')).toBeInTheDocument();
    expect(screen.getByText('settings.export.description')).toBeInTheDocument();
  });

  it('should show alert when no data to export', () => {
    (localStorage.getAppData as jest.Mock).mockReturnValue(null);

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    expect(global.alert).toHaveBeenCalledWith('settings.export.noData');
  });

  it('should export data when available', () => {
    const mockData = createMockAppData({
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
    });

    (localStorage.getAppData as jest.Mock).mockReturnValue(mockData);
    (localStorage.exportToJSON as jest.Mock).mockReturnValue(
      JSON.stringify(mockData),
    );

    render(<ExportButton />);

    const button = screen.getByText('settings.export.button');
    fireEvent.click(button);

    expect(localStorage.exportToJSON).toHaveBeenCalledWith(mockData);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});
