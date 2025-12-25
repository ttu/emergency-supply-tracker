import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Help.module.css';

interface HelpTopic {
  id: string;
  question: string;
  answer: string;
}

export function Help() {
  const { t } = useTranslation();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const toggleTopic = (topicId: string) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
  };

  const helpTopics: HelpTopic[] = [
    {
      id: 'getting-started',
      question: t('help.gettingStarted.question'),
      answer: t('help.gettingStarted.answer'),
    },
    {
      id: 'household-size',
      question: t('help.householdSize.question'),
      answer: t('help.householdSize.answer'),
    },
    {
      id: 'recommended-items',
      question: t('help.recommendedItems.question'),
      answer: t('help.recommendedItems.answer'),
    },
    {
      id: 'expiration-dates',
      question: t('help.expirationDates.question'),
      answer: t('help.expirationDates.answer'),
    },
    {
      id: 'categories',
      question: t('help.categories.question'),
      answer: t('help.categories.answer'),
    },
    {
      id: 'status-colors',
      question: t('help.statusColors.question'),
      answer: t('help.statusColors.answer'),
    },
    {
      id: 'export-import',
      question: t('help.exportImport.question'),
      answer: t('help.exportImport.answer'),
    },
    {
      id: 'data-storage',
      question: t('help.dataStorage.question'),
      answer: t('help.dataStorage.answer'),
    },
    {
      id: 'shopping-list',
      question: t('help.shoppingList.question'),
      answer: t('help.shoppingList.answer'),
    },
    {
      id: 'preparedness-score',
      question: t('help.preparednessScore.question'),
      answer: t('help.preparednessScore.answer'),
    },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('help.title')}</h1>
        <p className={styles.subtitle}>{t('help.subtitle')}</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>{t('help.faqTitle')}</h2>
          <div className={styles.topics}>
            {helpTopics.map((topic) => (
              <div key={topic.id} className={styles.topic}>
                <button
                  className={styles.topicButton}
                  onClick={() => toggleTopic(topic.id)}
                  aria-expanded={expandedTopic === topic.id}
                >
                  <span className={styles.topicQuestion}>{topic.question}</span>
                  <span
                    className={`${styles.topicIcon} ${expandedTopic === topic.id ? styles.expanded : ''}`}
                  >
                    ▼
                  </span>
                </button>
                {expandedTopic === topic.id && (
                  <div className={styles.topicAnswer}>{topic.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t('help.quickTipsTitle')}</h2>
          <ul className={styles.tipsList}>
            <li>{t('help.tips.tip1')}</li>
            <li>{t('help.tips.tip2')}</li>
            <li>{t('help.tips.tip3')}</li>
            <li>{t('help.tips.tip4')}</li>
            <li>{t('help.tips.tip5')}</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('help.contactTitle')}</h2>
          <p>{t('help.contactText')}</p>
          <a
            href="https://github.com/yourusername/emergency-supply-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {t('help.githubLink')}
          </a>
        </section>
      </div>
    </div>
  );
}
