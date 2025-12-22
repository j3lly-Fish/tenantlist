import React, { useState } from 'react';
import styles from './BenefitsTabs.module.css';

type TabType = 'tenants' | 'landlords' | 'brokers';

interface BenefitsTabsProps {
  onGetStarted?: () => void;
}

interface Benefit {
  title: string;
  description: string;
}

const benefitsData: Record<TabType, Benefit[]> = {
  tenants: [
    {
      title: 'Find the perfect space',
      description: 'Post your requirements and let properties come to you instead of searching endlessly',
    },
    {
      title: 'Receive tailored proposals',
      description: 'Get matched with landlords who meet your exact specifications',
    },
    {
      title: 'Compare options easily',
      description: 'Review multiple proposals side-by-side to make informed decisions',
    },
    {
      title: 'Save time and money',
      description: 'Reduce the time spent on property searches by up to 70%',
    },
  ],
  landlords: [
    {
      title: 'Fill vacancies faster',
      description: 'Connect directly with qualified tenants actively looking for spaces like yours',
    },
    {
      title: 'Target the right tenants',
      description: 'See tenant requirements upfront and respond only to relevant opportunities',
    },
    {
      title: 'Reduce marketing costs',
      description: 'No more expensive listings - tenants find you through demand matching',
    },
    {
      title: 'Streamline negotiations',
      description: 'Use built-in tools for proposals, messaging, and lease agreements',
    },
  ],
  brokers: [
    {
      title: 'Expand your deal pipeline',
      description: 'Access a steady stream of qualified leads and tenant requirements',
    },
    {
      title: 'Close deals faster',
      description: 'Match tenants with properties in your portfolio more efficiently',
    },
    {
      title: 'Manage multiple clients',
      description: 'Track all your tenant and landlord relationships in one platform',
    },
    {
      title: 'Increase your earnings',
      description: 'More deals, less legwork - focus on high-value negotiations',
    },
  ],
};

/**
 * BenefitsTabs Component
 *
 * Landing page section showing benefits for different user types:
 * - "It's right for you" heading
 * - "Get Started" button
 * - 3 tabs: Tenants | Landlords | Brokers
 * - Tab content shows tailored benefits list for each role
 */
export const BenefitsTabs: React.FC<BenefitsTabsProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tenants');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'tenants', label: 'Tenants' },
    { id: 'landlords', label: 'Landlords' },
    { id: 'brokers', label: 'Brokers' },
  ];

  const handleGetStarted = () => {
    onGetStarted?.();
  };

  return (
    <section className={styles.section} aria-labelledby="benefits-title">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left side - Heading and CTA */}
          <div className={styles.leftColumn}>
            <h2 id="benefits-title" className={styles.title}>
              It's right for you
            </h2>
            <p className={styles.description}>
              Whether you're searching for the perfect space, looking to fill vacancies, or growing your brokerage business, our platform is designed to help you succeed.
            </p>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={handleGetStarted}
            >
              Get Started
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Right side - Tabs and content */}
          <div className={styles.rightColumn}>
            {/* Tab buttons */}
            <div className={styles.tabList} role="tablist" aria-label="User type benefits">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {tabs.map((tab) => (
              <div
                key={tab.id}
                role="tabpanel"
                id={`tabpanel-${tab.id}`}
                aria-labelledby={`tab-${tab.id}`}
                className={styles.tabPanel}
                hidden={activeTab !== tab.id}
              >
                <ul className={styles.benefitsList}>
                  {benefitsData[tab.id].map((benefit, index) => (
                    <li key={index} className={styles.benefitItem}>
                      <div className={styles.benefitIcon}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className={styles.benefitContent}>
                        <h4 className={styles.benefitTitle}>{benefit.title}</h4>
                        <p className={styles.benefitDescription}>{benefit.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
