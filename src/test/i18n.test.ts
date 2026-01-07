import { describe, it, expect, vi } from 'vitest';
import { defaultI18nMock, createI18nMock } from './i18n';

describe('i18n test utilities', () => {
  describe('defaultI18nMock', () => {
    it('should return translation key as-is', () => {
      const { t } = defaultI18nMock.useTranslation();
      expect(t('dashboard.title')).toBe('dashboard.title');
    });

    it('should provide i18n object with language and changeLanguage', () => {
      const { i18n } = defaultI18nMock.useTranslation();
      expect(i18n.language).toBe('en');
      expect(i18n.changeLanguage).toBeDefined();
    });

    it('should provide withTranslation HOC', () => {
      const Component = () => null;
      const wrapped = defaultI18nMock.withTranslation()(Component);
      expect(wrapped).toBe(Component);
    });

    it('should provide Trans component that returns children', () => {
      const children = 'Test';
      const result = defaultI18nMock.Trans({ children });
      expect(result).toBe(children);
    });

    it('should provide I18nextProvider that returns children', () => {
      const children = 'Test';
      const result = defaultI18nMock.I18nextProvider({ children });
      expect(result).toBe(children);
    });
  });

  describe('createI18nMock', () => {
    it('should use default translations when none provided', () => {
      const mock = createI18nMock();
      const { t } = mock.useTranslation();
      expect(t('dashboard.title')).toBe('dashboard.title');
    });

    it('should use provided translations', () => {
      const mock = createI18nMock({
        translations: {
          'dashboard.title': 'Dashboard',
          'dashboard.subtitle': 'Welcome, {{name}}!',
        },
      });
      const { t } = mock.useTranslation();
      expect(t('dashboard.title')).toBe('Dashboard');
      expect(t('dashboard.subtitle', { name: 'John' })).toBe('Welcome, John!');
    });

    it('should interpolate template strings with parameters', () => {
      const mock = createI18nMock({
        translations: {
          greeting: 'Hello, {{name}}! You have {{count}} items.',
        },
      });
      const { t } = mock.useTranslation();
      expect(t('greeting', { name: 'Alice', count: 5 })).toBe(
        'Hello, Alice! You have 5 items.',
      );
    });

    it('should handle missing parameters in interpolation', () => {
      const mock = createI18nMock({
        translations: {
          greeting: 'Hello, {{name}}!',
        },
      });
      const { t } = mock.useTranslation();
      expect(t('greeting', {})).toBe('Hello, {{name}}!');
    });

    it('should use namespace translations when ns param provided', () => {
      const mock = createI18nMock({
        namespaces: {
          categories: {
            food: 'Food',
            water: 'Water',
          },
        },
      });
      const { t } = mock.useTranslation();
      expect(t('food', { ns: 'categories' })).toBe('Food');
      expect(t('water', { ns: 'categories' })).toBe('Water');
    });

    it('should interpolate namespace translations with parameters', () => {
      const mock = createI18nMock({
        namespaces: {
          products: {
            item: '{{name}} ({{quantity}}x)',
          },
        },
      });
      const { t } = mock.useTranslation();
      expect(t('item', { ns: 'products', name: 'Water', quantity: 10 })).toBe(
        'Water (10x)',
      );
    });

    it('should fall back to key when namespace translation not found', () => {
      const mock = createI18nMock({
        namespaces: {
          categories: {
            food: 'Food',
          },
        },
      });
      const { t } = mock.useTranslation();
      expect(t('water', { ns: 'categories' })).toBe('water');
    });

    it('should use custom language', () => {
      const mock = createI18nMock({
        language: 'fi',
      });
      const { i18n } = mock.useTranslation();
      expect(i18n.language).toBe('fi');
    });

    it('should use custom changeLanguage mock', () => {
      const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
      const mock = createI18nMock({
        changeLanguage: mockChangeLanguage,
      });
      const { i18n } = mock.useTranslation();
      expect(i18n.changeLanguage).toBe(mockChangeLanguage);
    });

    it('should provide withTranslation HOC', () => {
      const mock = createI18nMock();
      const Component = () => null;
      const wrapped = mock.withTranslation()(Component);
      expect(wrapped).toBe(Component);
    });

    it('should provide Trans component that returns children', () => {
      const mock = createI18nMock();
      const children = 'Test';
      const result = mock.Trans({ children });
      expect(result).toBe(children);
    });

    it('should provide I18nextProvider that returns children', () => {
      const mock = createI18nMock();
      const children = 'Test';
      const result = mock.I18nextProvider({ children });
      expect(result).toBe(children);
    });

    it('should prioritize namespace translations over direct translations', () => {
      const mock = createI18nMock({
        translations: {
          item: 'Direct Translation',
        },
        namespaces: {
          products: {
            item: 'Namespace Translation',
          },
        },
      });
      const { t } = mock.useTranslation();
      expect(t('item', { ns: 'products' })).toBe('Namespace Translation');
      expect(t('item')).toBe('Direct Translation');
    });
  });
});
