import { Component, ErrorInfo, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { logErrorBoundary } from '@/shared/utils/errorLogger';
import {
  getAppData,
  exportToJSON,
  clearAppData,
} from '@/shared/utils/storage/localStorage';
import { clearErrorLogs } from '@/shared/utils/errorLogger/storage';
import { clearAnalyticsData } from '@/shared/utils/analytics/storage';
import { downloadFile, generateDateFilename } from '@/shared/utils/download';
import styles from './ErrorBoundary.module.css';

export interface ErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryComponent extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logErrorBoundary(error, {
      componentStack: errorInfo.componentStack ?? undefined,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleDownloadData = (): void => {
    const { t } = this.props;
    const data = getAppData();
    if (!data) {
      alert(t('settings.export.noData'));
      return;
    }

    const json = exportToJSON(data);
    const filename = generateDateFilename('emergency-supplies');
    downloadFile(json, filename);
  };

  handleDeleteData = (): void => {
    const { t } = this.props;
    if (window.confirm(t('errorBoundary.dataManagement.confirmDelete'))) {
      if (
        window.confirm(t('errorBoundary.dataManagement.confirmDeleteAgain'))
      ) {
        clearAppData();
        clearErrorLogs();
        clearAnalyticsData();
        alert(t('errorBoundary.dataManagement.deleteSuccess'));
        window.location.reload();
      }
    }
  };

  render(): ReactNode {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container} role="alert">
          <div className={styles.content}>
            <div className={styles.icon} aria-hidden="true">
              ⚠️
            </div>
            <h1 className={styles.title}>{t('errorBoundary.title')}</h1>
            <p className={styles.message}>{t('errorBoundary.message')}</p>
            {this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>
                  {t('errorBoundary.details')}
                </summary>
                <pre className={styles.errorText}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={this.handleReload}
              >
                {t('errorBoundary.reload')}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={this.handleReset}
              >
                {t('errorBoundary.tryAgain')}
              </button>
            </div>

            <div className={styles.dataManagement}>
              <h2 className={styles.dataManagementTitle}>
                {t('errorBoundary.dataManagement.title')}
              </h2>
              <p className={styles.dataManagementDescription}>
                {t('errorBoundary.dataManagement.description')}
              </p>
              <div className={styles.dataManagementActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={this.handleDownloadData}
                  data-testid="error-boundary-download-button"
                >
                  {t('errorBoundary.dataManagement.downloadData')}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={this.handleDeleteData}
                  data-testid="error-boundary-delete-button"
                >
                  {t('errorBoundary.dataManagement.deleteData')}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryComponent);
