import React, { useState, useEffect, useRef } from 'react';
import styles from './InviteBrokersModal.module.css';

interface Broker {
  id: string;
  name: string;
  email: string;
  company_name?: string;
  photo_url?: string;
}

interface InviteBrokersModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
}

export const InviteBrokersModal: React.FC<InviteBrokersModalProps> = ({
  isOpen,
  onClose,
  businessId,
  businessName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Broker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [invitedBrokers, setInvitedBrokers] = useState<Broker[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced broker search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search/brokers?q=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          setSearchResults(result.data.brokers || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Failed to search brokers:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddBroker = (broker: Broker) => {
    const isAlreadyInvited = invitedBrokers.some((b) => b.id === broker.id);
    if (!isAlreadyInvited) {
      setInvitedBrokers([...invitedBrokers, broker]);
    }
    setSearchQuery('');
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleRemoveBroker = (brokerId: string) => {
    setInvitedBrokers(invitedBrokers.filter((b) => b.id !== brokerId));
  };

  const handleSendInvites = async () => {
    if (invitedBrokers.length === 0) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/invite-brokers`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broker_ids: invitedBrokers.map((b) => b.id),
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Successfully invited ${invitedBrokers.length} broker${invitedBrokers.length > 1 ? 's' : ''}!`);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Failed to send invitations');
      }
    } catch (error) {
      console.error('Failed to send invites:', error);
      alert('An error occurred while sending invitations');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setInvitedBrokers([]);
    setSuccessMessage('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Invite Brokers</h2>
            <p className={styles.modalSubtitle}>
              Invite brokers to help with {businessName}
            </p>
          </div>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {successMessage ? (
            <div className={styles.successMessage}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className={styles.searchSection}>
                <h3 className={styles.sectionTitle}>Search for Brokers</h3>
                <div className={styles.searchInputContainer}>
                  <div className={styles.searchInput}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search by name, email, or company"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowResults(true);
                        }
                      }}
                    />
                    {isSearching && <span className={styles.searchingIndicator}>...</span>}
                  </div>

                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                      {searchResults.map((broker) => {
                        const isInvited = invitedBrokers.some((b) => b.id === broker.id);
                        return (
                          <div
                            key={broker.id}
                            className={`${styles.searchResultItem} ${isInvited ? styles.alreadyInvited : ''}`}
                            onClick={() => !isInvited && handleAddBroker(broker)}
                          >
                            <div className={styles.brokerInfo}>
                              {broker.photo_url ? (
                                <img src={broker.photo_url} alt={broker.name} className={styles.brokerAvatar} />
                              ) : (
                                <div className={styles.brokerAvatarPlaceholder}>
                                  {broker.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={styles.brokerDetails}>
                                <div className={styles.brokerName}>{broker.name}</div>
                                <div className={styles.brokerEmail}>{broker.email}</div>
                                {broker.company_name && (
                                  <div className={styles.brokerCompany}>{broker.company_name}</div>
                                )}
                              </div>
                            </div>
                            {isInvited && <span className={styles.invitedBadge}>Added</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Invited Brokers List */}
              {invitedBrokers.length > 0 && (
                <div className={styles.invitedSection}>
                  <h3 className={styles.sectionTitle}>
                    Selected Brokers ({invitedBrokers.length})
                  </h3>
                  <div className={styles.invitedList}>
                    {invitedBrokers.map((broker) => (
                      <div key={broker.id} className={styles.invitedBroker}>
                        {broker.photo_url ? (
                          <img src={broker.photo_url} alt={broker.name} className={styles.brokerAvatar} />
                        ) : (
                          <div className={styles.brokerAvatarPlaceholder}>
                            {broker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={styles.brokerInfo}>
                          <div className={styles.brokerName}>{broker.name}</div>
                          <div className={styles.brokerEmail}>{broker.email}</div>
                        </div>
                        <button
                          className={styles.removeButton}
                          onClick={() => handleRemoveBroker(broker.id)}
                          aria-label="Remove broker"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.cancelButton}
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendInvites}
                  className={styles.sendButton}
                  disabled={invitedBrokers.length === 0 || isSending}
                >
                  {isSending ? 'Sending...' : `Send ${invitedBrokers.length} Invitation${invitedBrokers.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
