import { useTranslation } from 'react-i18next';
import styles from './DashboardHeader.module.css';

export interface DashboardHeaderProps {
  preparednessScore: number; // 0-100
  householdSize: number;
  supplyDays: number;
}

export const DashboardHeader = ({
  preparednessScore,
  householdSize,
  supplyDays,
}: DashboardHeaderProps) => {
  const { t } = useTranslation();

  const getScoreColor = (score: number): string => {
    if (score >= 80) return styles.scoreGood;
    if (score >= 50) return styles.scoreWarning;
    return styles.scoreCritical;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return t('dashboard.preparedness.excellent');
    if (score >= 50) return t('dashboard.preparedness.good');
    return t('dashboard.preparedness.needsWork');
  };

  return (
    <div className={styles.header}>
      <div className={styles.content}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t('dashboard.title')}</h1>
          <p className={styles.subtitle}>
            {t('dashboard.subtitle', {
              people: householdSize,
              days: supplyDays,
            })}
          </p>
        </div>

        <div className={styles.scoreSection}>
          <div className={styles.scoreCircle}>
            <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
              <circle
                cx="50"
                cy="50"
                r="45"
                className={styles.scoreBackground}
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className={`${styles.scoreProgress} ${getScoreColor(preparednessScore)}`}
                strokeDasharray={`${preparednessScore * 2.83} 283`}
              />
            </svg>
            <div className={styles.scoreValue}>
              <span className={styles.scoreNumber}>{preparednessScore}</span>
              <span className={styles.scorePercent}>%</span>
            </div>
          </div>
          <div className={styles.scoreLabel}>
            {getScoreLabel(preparednessScore)}
          </div>
        </div>
      </div>
    </div>
  );
};
