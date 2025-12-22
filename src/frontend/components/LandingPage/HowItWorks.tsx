import React from 'react';
import styles from './HowItWorks.module.css';

/**
 * HowItWorks Component
 *
 * Landing page section explaining the 3-step process:
 * - Title: "How it Works"
 * - Subtitle: "A simple, three-step process to find your perfect commercial space"
 * - 3 step cards with icons:
 *   - Step 1: "Post Your Needs" - Describe your ideal space requirements
 *   - Step 2: "Get Matched Instantly" - Landlords and brokers send tailored property proposals
 *   - Step 3: "Review & Lease" - Message, compare options, and finalize agreements
 */
export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Post Your Needs',
      description: 'Describe your ideal space requirements',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Get Matched Instantly',
      description: 'Landlords and brokers send tailored property proposals',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Review & Lease',
      description: 'Message, compare options, and finalize agreements',
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
  ];

  return (
    <section className={styles.section} aria-labelledby="how-it-works-title">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="how-it-works-title" className={styles.title}>
            How it Works
          </h2>
          <p className={styles.subtitle}>
            A simple, three-step process to find your perfect commercial space
          </p>
        </div>

        {/* Steps */}
        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <div key={step.number} className={styles.stepCard}>
              <div className={styles.stepNumber}>
                <span>{step.number}</span>
              </div>
              <div className={styles.stepIcon}>{step.icon}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>

        {/* Connector lines (decorative) */}
        <div className={styles.connectorLines} aria-hidden="true">
          <div className={styles.connectorLine} />
          <div className={styles.connectorLine} />
        </div>
      </div>
    </section>
  );
};
