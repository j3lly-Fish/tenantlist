import React from 'react';
import styles from './TenantDocumentsSection.module.css';

interface TenantDocument {
  id: string;
  document_name: string;
  document_url: string;
  document_type?: string | null;
}

interface TenantDocumentsSectionProps {
  documents: TenantDocument[];
}

/**
 * TenantDocumentsSection Component
 *
 * Displays list of documents with icons and download links
 */
export const TenantDocumentsSection: React.FC<TenantDocumentsSectionProps> = ({
  documents,
}) => {
  if (!documents || documents.length === 0) {
    return null;
  }

  const getFileIcon = (documentType?: string | null): JSX.Element => {
    const type = documentType?.toLowerCase();

    if (type === 'pdf') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M14 2V8H20"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text
            x="12"
            y="16"
            fontFamily="Arial"
            fontSize="6"
            fontWeight="600"
            fill="#dc2626"
            textAnchor="middle"
          >
            PDF
          </text>
        </svg>
      );
    }

    if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type || '')) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#10b981" />
          <path
            d="M21 15L16 10L5 21"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (type === 'doc' || type === 'docx') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M14 2V8H20"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M8 13H16M8 17H16"
            stroke="#2563eb"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    if (type === 'xlsx' || type === 'xls') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M14 2V8H20"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M8 12H16M8 16H16M12 12V16"
            stroke="#16a34a"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    // Default file icon
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M14 2V8H20"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  };

  const handleDownload = (doc: TenantDocument) => {
    // Open document in new tab for download/view
    window.open(doc.document_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={styles.documentsSection}>
      <h2 className={styles.sectionTitle}>Documents</h2>
      <div className={styles.documentsList}>
        {documents.map((doc) => (
          <div key={doc.id} className={styles.documentItem}>
            <div className={styles.documentIcon}>
              {getFileIcon(doc.document_type)}
            </div>
            <div className={styles.documentInfo}>
              <span className={styles.documentName}>{doc.document_name}</span>
              {doc.document_type && (
                <span className={styles.documentType}>
                  {doc.document_type.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => handleDownload(doc)}
              className={styles.downloadButton}
              aria-label={`Download ${doc.document_name}`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 13.5L6 9.5M10 13.5L14 9.5M10 13.5V3.5M17 13.5V16.5C17 16.7761 16.7761 17 16.5 17H3.5C3.22386 17 3 16.7761 3 16.5V13.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
