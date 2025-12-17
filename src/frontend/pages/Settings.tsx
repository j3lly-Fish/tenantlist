import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TopNavigation } from '@components/TopNavigation';
import { SubscriptionPlan, SubscriptionWithPlan, BillingTransaction, SubscriptionTier } from '@types';
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  getBillingHistory,
  getNotificationPreferences,
  updateNotificationPreferences,
  unsubscribeAllNotifications,
  resubscribeNotifications,
  NotificationPreferences,
} from '@utils/apiClient';
import styles from './Settings.module.css';

type TabType = 'subscription' | 'billing' | 'notifications' | 'account';

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('subscription');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.STARTER);
  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>([]);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationSaving, setNotificationSaving] = useState(false);

  // Account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Check for subscription success/cancel from URL
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    if (subscriptionStatus === 'success') {
      setSuccessMessage('Your subscription has been activated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } else if (subscriptionStatus === 'canceled') {
      setError('Subscription checkout was canceled.');
      setTimeout(() => setError(null), 5000);
    }
  }, [searchParams]);

  // Load subscription data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [plansData, subscriptionData] = await Promise.all([
          getSubscriptionPlans(),
          getCurrentSubscription(),
        ]);

        setPlans(plansData);
        setCurrentSubscription(subscriptionData.subscription);
        setCurrentTier(subscriptionData.tier);
        setIsStripeConfigured(subscriptionData.isConfigured);

        // Load billing history if user has a subscription
        if (subscriptionData.subscription) {
          try {
            const history = await getBillingHistory();
            setBillingHistory(history);
          } catch (e) {
            // Billing history is optional
            console.error('Failed to load billing history:', e);
          }
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load subscription data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpgrade = async (planTier: SubscriptionTier) => {
    if (!isStripeConfigured) {
      setError('Stripe is not configured. Please contact support.');
      return;
    }

    try {
      setProcessingPlan(planTier);
      setError(null);

      const { url } = await createCheckoutSession(planTier, billingInterval);

      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to start checkout');
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    if (!isStripeConfigured) {
      setError('Stripe is not configured. Please contact support.');
      return;
    }

    try {
      setError(null);
      const { url } = await createBillingPortalSession();

      if (url) {
        window.location.href = url;
      }
    } catch (e: any) {
      setError(e.message || 'Failed to open billing portal');
    }
  };

  // Load notification preferences when tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && !notificationPrefs && !notificationLoading) {
      loadNotificationPreferences();
    }
  }, [activeTab]);

  const loadNotificationPreferences = async () => {
    try {
      setNotificationLoading(true);
      const prefs = await getNotificationPreferences();
      setNotificationPrefs(prefs);
    } catch (e: any) {
      console.error('Failed to load notification preferences:', e);
      setError(e.message || 'Failed to load notification preferences');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleNotificationToggle = async (
    category: 'email' | 'inApp',
    key: string,
    value: boolean
  ) => {
    if (!notificationPrefs) return;

    // Optimistic update
    const updatedPrefs = {
      ...notificationPrefs,
      [category]: {
        ...notificationPrefs[category],
        [key]: value,
      },
    };
    setNotificationPrefs(updatedPrefs);

    try {
      setNotificationSaving(true);
      await updateNotificationPreferences({
        [category]: { [key]: value },
      });
    } catch (e: any) {
      // Revert on error
      setNotificationPrefs(notificationPrefs);
      setError(e.message || 'Failed to update preference');
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleEmailFrequencyChange = async (frequency: 'instant' | 'daily' | 'weekly') => {
    if (!notificationPrefs) return;

    const updatedPrefs = {
      ...notificationPrefs,
      settings: {
        ...notificationPrefs.settings,
        email_frequency: frequency,
      },
    };
    setNotificationPrefs(updatedPrefs);

    try {
      setNotificationSaving(true);
      await updateNotificationPreferences({
        settings: { email_frequency: frequency },
      });
    } catch (e: any) {
      setNotificationPrefs(notificationPrefs);
      setError(e.message || 'Failed to update email frequency');
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all marketing emails?')) return;

    try {
      setNotificationSaving(true);
      await unsubscribeAllNotifications();
      setNotificationPrefs(prev => prev ? { ...prev, unsubscribed_all: true } : null);
      setSuccessMessage('Successfully unsubscribed from all marketing emails');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      setError(e.message || 'Failed to unsubscribe');
    } finally {
      setNotificationSaving(false);
    }
  };

  const handleResubscribe = async () => {
    try {
      setNotificationSaving(true);
      await resubscribeNotifications();
      await loadNotificationPreferences();
      setSuccessMessage('Successfully resubscribed to emails');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      setError(e.message || 'Failed to resubscribe');
    } finally {
      setNotificationSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getTierOrder = (tier: SubscriptionTier): number => {
    const order: Record<SubscriptionTier, number> = {
      [SubscriptionTier.STARTER]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.PREMIUM]: 2,
      [SubscriptionTier.ENTERPRISE]: 3,
    };
    return order[tier] ?? 0;
  };

  const getButtonText = (planTier: SubscriptionTier) => {
    if (processingPlan === planTier) return 'Processing...';
    if (planTier === currentTier) return 'Current Plan';
    if (getTierOrder(planTier) > getTierOrder(currentTier)) return 'Upgrade';
    return 'Downgrade';
  };

  const renderSubscriptionTab = () => (
    <>
      {/* Current Subscription Info */}
      {currentSubscription && (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Current Subscription</h3>
          <div className={styles.subscriptionInfo}>
            <div className={styles.subscriptionDetails}>
              <span className={styles.subscriptionTier}>
                {currentSubscription.plan.name} Plan
              </span>
              <span className={styles.subscriptionStatus}>
                <span
                  className={`${styles.statusDot} ${
                    currentSubscription.status === 'active'
                      ? styles.active
                      : currentSubscription.status === 'past_due'
                      ? styles.pastDue
                      : styles.canceled
                  }`}
                />
                {currentSubscription.status === 'active'
                  ? 'Active'
                  : currentSubscription.status === 'past_due'
                  ? 'Past Due'
                  : 'Canceled'}
                {currentSubscription.current_period_end && (
                  <> - Renews {formatDate(currentSubscription.current_period_end)}</>
                )}
              </span>
            </div>
            <button className={styles.manageButton} onClick={handleManageBilling}>
              Manage Billing
            </button>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Available Plans</h3>
        <p className={styles.sectionDescription}>
          Choose the plan that best fits your business needs
        </p>

        {/* Billing Toggle */}
        <div className={styles.billingToggle}>
          <span className={`${styles.billingOption} ${billingInterval === 'monthly' ? styles.active : ''}`}>
            Monthly
          </span>
          <div
            className={`${styles.toggleSwitch} ${billingInterval === 'annual' ? styles.annual : ''}`}
            onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
          />
          <span className={`${styles.billingOption} ${billingInterval === 'annual' ? styles.active : ''}`}>
            Annual
          </span>
          <span className={styles.savingsBadge}>Save 17%</span>
        </div>

        {/* Plans Grid */}
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            const isRecommended = plan.tier === SubscriptionTier.PRO && currentTier === SubscriptionTier.STARTER;
            const price = billingInterval === 'annual'
              ? plan.price_annually || plan.price_monthly * 10
              : plan.price_monthly;

            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${isCurrent ? styles.current : ''} ${
                  isRecommended ? styles.recommended : ''
                }`}
              >
                {isCurrent && <span className={styles.currentBadge}>Current</span>}
                {isRecommended && !isCurrent && (
                  <span className={styles.recommendedBadge}>Recommended</span>
                )}
                <h4 className={styles.planName}>{plan.name}</h4>
                <div className={styles.planPrice}>
                  {formatPrice(price)}
                  <span>/{billingInterval === 'annual' ? 'year' : 'month'}</span>
                </div>
                <p className={styles.planDescription}>{plan.description}</p>

                <ul className={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <li key={index} className={styles.featureItem}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6.5 11.5L3 8l1-1 2.5 2.5L12 4l1 1-6.5 6.5z" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`${styles.planButton} ${
                    isCurrent ? styles.secondary : styles.primary
                  }`}
                  disabled={isCurrent || processingPlan !== null}
                  onClick={() => handleUpgrade(plan.tier)}
                >
                  {getButtonText(plan.tier)}
                </button>
              </div>
            );
          })}
        </div>

        {!isStripeConfigured && (
          <div className={`${styles.alert} ${styles.warning}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 12a1 1 0 110-2 1 1 0 010 2zm1-4a1 1 0 01-2 0V7a1 1 0 012 0v3z" />
            </svg>
            Stripe is not configured. Contact support to enable payments.
          </div>
        )}
      </div>
    </>
  );

  const renderBillingTab = () => (
    <div className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}>Billing History</h3>
      <p className={styles.sectionDescription}>
        View your past invoices and payment history
      </p>

      {billingHistory.length > 0 ? (
        <table className={styles.billingTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.billing_date)}</td>
                <td>{transaction.description || 'Subscription payment'}</td>
                <td>
                  {formatPrice(transaction.amount)} {transaction.currency}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[transaction.status]}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>
                  {transaction.receipt_url ? (
                    <a
                      href={transaction.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.receiptLink}
                    >
                      View Receipt
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={styles.emptyState}>
          <p>No billing history available</p>
        </div>
      )}

      {currentSubscription && (
        <button className={styles.manageButton} onClick={handleManageBilling} style={{ marginTop: '24px' }}>
          Manage Payment Methods
        </button>
      )}
    </div>
  );

  const renderNotificationsTab = () => {
    if (notificationLoading) {
      return (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading notification preferences...</p>
        </div>
      );
    }

    if (!notificationPrefs) {
      return (
        <div className={styles.sectionCard}>
          <div className={styles.emptyState}>
            <p>Failed to load notification preferences</p>
            <button className={styles.manageButton} onClick={loadNotificationPreferences}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (notificationPrefs.unsubscribed_all) {
      return (
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Email Notifications Disabled</h3>
          <p className={styles.sectionDescription}>
            You have unsubscribed from all marketing emails. You will still receive essential account notifications.
          </p>
          <button
            className={styles.manageButton}
            onClick={handleResubscribe}
            disabled={notificationSaving}
          >
            {notificationSaving ? 'Resubscribing...' : 'Resubscribe to Emails'}
          </button>
        </div>
      );
    }

    const emailNotifications = [
      { key: 'new_matches', label: 'New Property Matches', description: 'When properties match your QFP criteria' },
      { key: 'new_messages', label: 'New Messages', description: 'When you receive a new message' },
      { key: 'business_invites', label: 'Business Invitations', description: 'When someone invites you to join their business' },
      { key: 'tour_reminders', label: 'Tour Reminders', description: 'Reminders for scheduled property tours' },
      { key: 'account_updates', label: 'Account Updates', description: 'Important updates about your account' },
      { key: 'weekly_digest', label: 'Weekly Digest', description: 'Weekly summary of activity and new matches' },
    ];

    const inAppNotifications = [
      { key: 'new_matches', label: 'New Property Matches', description: 'Real-time alerts for new matches' },
      { key: 'new_messages', label: 'New Messages', description: 'Real-time message notifications' },
      { key: 'business_invites', label: 'Business Invitations', description: 'Alerts for new invitations' },
      { key: 'tour_reminders', label: 'Tour Reminders', description: 'In-app tour reminders' },
      { key: 'account_updates', label: 'Account Updates', description: 'Important account alerts' },
    ];

    return (
      <>
        {/* Email Notifications */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Email Notifications</h3>
          <p className={styles.sectionDescription}>
            Choose which emails you'd like to receive
          </p>

          <div className={styles.notificationList}>
            {emailNotifications.map(({ key, label, description }) => (
              <div key={key} className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <span className={styles.notificationLabel}>{label}</span>
                  <span className={styles.notificationDescription}>{description}</span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.email[key as keyof typeof notificationPrefs.email]}
                    onChange={(e) => handleNotificationToggle('email', key, e.target.checked)}
                    disabled={notificationSaving}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            ))}
          </div>

          {/* Email Frequency */}
          <div className={styles.frequencySection}>
            <h4 className={styles.frequencyTitle}>Email Frequency</h4>
            <p className={styles.frequencyDescription}>
              How often would you like to receive email digests?
            </p>
            <div className={styles.frequencyOptions}>
              {(['instant', 'daily', 'weekly'] as const).map((freq) => (
                <label key={freq} className={styles.frequencyOption}>
                  <input
                    type="radio"
                    name="emailFrequency"
                    checked={notificationPrefs.settings.email_frequency === freq}
                    onChange={() => handleEmailFrequencyChange(freq)}
                    disabled={notificationSaving}
                  />
                  <span className={styles.frequencyLabel}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>In-App Notifications</h3>
          <p className={styles.sectionDescription}>
            Manage real-time notifications within the app
          </p>

          <div className={styles.notificationList}>
            {inAppNotifications.map(({ key, label, description }) => (
              <div key={key} className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <span className={styles.notificationLabel}>{label}</span>
                  <span className={styles.notificationDescription}>{description}</span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.inApp[key as keyof typeof notificationPrefs.inApp]}
                    onChange={(e) => handleNotificationToggle('inApp', key, e.target.checked)}
                    disabled={notificationSaving}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Unsubscribe Section */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Unsubscribe</h3>
          <p className={styles.sectionDescription}>
            Unsubscribe from all marketing emails. You will still receive essential account notifications.
          </p>
          <button
            className={`${styles.manageButton} ${styles.danger}`}
            onClick={handleUnsubscribeAll}
            disabled={notificationSaving}
          >
            {notificationSaving ? 'Processing...' : 'Unsubscribe from All Marketing Emails'}
          </button>
        </div>
      </>
    );
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('This will log you out of all devices. Continue?')) return;
    try {
      await logout();
      navigate('/');
    } catch (e) {
      setError('Failed to logout');
    }
  };

  const renderAccountTab = () => (
    <>
      {/* Profile Section */}
      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Profile Information</h3>
        <p className={styles.sectionDescription}>
          Manage your personal information and profile settings
        </p>
        <div className={styles.accountItem}>
          <div className={styles.accountItemInfo}>
            <span className={styles.accountItemLabel}>Personal Details</span>
            <span className={styles.accountItemDescription}>
              Update your name, photo, phone number, and bio
            </span>
          </div>
          <button
            className={styles.accountButton}
            onClick={() => navigate('/profile')}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Security</h3>
        <p className={styles.sectionDescription}>
          Manage your password and account security
        </p>

        <div className={styles.accountItem}>
          <div className={styles.accountItemInfo}>
            <span className={styles.accountItemLabel}>Password</span>
            <span className={styles.accountItemDescription}>
              Change your password to keep your account secure
            </span>
          </div>
          <button
            className={styles.accountButton}
            onClick={() => navigate('/profile')}
          >
            Change Password
          </button>
        </div>

        <div className={styles.accountItem}>
          <div className={styles.accountItemInfo}>
            <span className={styles.accountItemLabel}>Active Sessions</span>
            <span className={styles.accountItemDescription}>
              Sign out of all devices except this one
            </span>
          </div>
          <button
            className={`${styles.accountButton} ${styles.secondary}`}
            onClick={handleLogoutAllDevices}
          >
            Sign Out All Devices
          </button>
        </div>
      </div>

      {/* Account Info Section */}
      <div className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Account Information</h3>
        <p className={styles.sectionDescription}>
          View your account details
        </p>

        <div className={styles.accountInfoGrid}>
          <div className={styles.accountInfoItem}>
            <span className={styles.accountInfoLabel}>Email</span>
            <span className={styles.accountInfoValue}>{user?.email || 'Not available'}</span>
          </div>
          <div className={styles.accountInfoItem}>
            <span className={styles.accountInfoLabel}>Account Type</span>
            <span className={styles.accountInfoValue}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
            </span>
          </div>
          <div className={styles.accountInfoItem}>
            <span className={styles.accountInfoLabel}>Email Verified</span>
            <span className={styles.accountInfoValue}>
              {user?.emailVerified ? (
                <span className={styles.verified}>Verified</span>
              ) : (
                <span className={styles.unverified}>Not Verified</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={`${styles.sectionCard} ${styles.dangerZone}`}>
        <h3 className={styles.sectionTitle}>Danger Zone</h3>
        <p className={styles.sectionDescription}>
          Irreversible actions that affect your account
        </p>

        {!showDeleteConfirm ? (
          <div className={styles.accountItem}>
            <div className={styles.accountItemInfo}>
              <span className={styles.accountItemLabel}>Delete Account</span>
              <span className={styles.accountItemDescription}>
                Permanently delete your account and all associated data
              </span>
            </div>
            <button
              className={`${styles.accountButton} ${styles.danger}`}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteWarning}>
              This action cannot be undone. All your data, including businesses, listings,
              messages, and subscription will be permanently deleted.
            </p>
            <p className={styles.deleteInstruction}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className={styles.deleteInput}
            />
            <div className={styles.deleteActions}>
              <button
                className={styles.cancelDeleteButton}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteButton}
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  alert('Account deletion is not yet implemented. Please contact support.');
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={styles.pageContainer}>
      <TopNavigation />
      <main className={styles.mainContent}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Manage your subscription, billing, and account preferences
          </p>
        </header>

        {/* Alerts */}
        {successMessage && (
          <div className={`${styles.alert} ${styles.success}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.5 6.5l-4 4-2-2 1-1 1 1 3-3 1 1z" />
            </svg>
            {successMessage}
          </div>
        )}
        {error && (
          <div className={`${styles.alert} ${styles.error}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V6h2v4z" />
            </svg>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <nav className={styles.tabNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'subscription' ? styles.active : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'billing' ? styles.active : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            Billing History
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'account' ? styles.active : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </nav>

        {/* Tab Content */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading settings...</p>
          </div>
        ) : (
          <>
            {activeTab === 'subscription' && renderSubscriptionTab()}
            {activeTab === 'billing' && renderBillingTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'account' && renderAccountTab()}
          </>
        )}
      </main>
    </div>
  );
};

export default Settings;
