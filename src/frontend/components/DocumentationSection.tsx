import React from 'react';
import styles from './DocumentationSection.module.css';

/**
 * Document interface for documentation links
 */
export interface Document {
  name: string;
  url: string;
}

/**
 * Props for DocumentationSection component
 */
export interface DocumentationSectionProps {
  documents: Document[];
}

/**
 * PDF Icon component
 */
const PdfIcon: React.FC = () => (
  <svg
    data-testid="pdf-icon"
    className={styles.pdfIcon}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 2C3.44772 2 3 2.44772 3 3V17C3 17.5523 3.44772 18 4 18H16C16.5523 18 17 17.5523 17 17V7L12 2H4Z"
      fill="#EF4444"
    />
    <path
      d="M12 2V7H17L12 2Z"
      fill="#FCA5A5"
    />
    <text
      x="10"
      y="14"
      fontSize="4"
      fontWeight="bold"
      fill="white"
      textAnchor="middle"
    >
      PDF
    </text>
  </svg>
);

/**
 * Default documents for demo purposes
 */
export const DEFAULT_DOCUMENTS: Document[] = [
  { name: 'Aventura Park Blueprints.pdf', url: '#' },
  { name: 'Zoning & Use Permits.pdf', url: '#' },
  { name: 'Environmental Reports.pdf', url: '#' },
  { name: 'Certificate of Occupancy.pdf', url: '#' },
];

/**
 * DocumentationSection Component
 *
 * Displays a list of document links with PDF icons.
 * Used on the PropertyDetail page to show available property documentation.
 *
 * Features:
 * - Section title "Documentation"
 * - List of document links with PDF icons
 * - Links open in new tab
 * - Empty state for when no documents are available
 */
export const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  documents,
}) => {
  return (
    <div className={styles.documentationSection}>
      <h2 className={styles.sectionTitle}>Documentation</h2>

      {documents.length === 0 ? (
        <p className={styles.emptyState}>No documents available</p>
      ) : (
        <ul className={styles.documentList}>
          {documents.map((doc, index) => (
            <li key={index} className={styles.documentItem}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.documentLink}
              >
                <PdfIcon />
                <span className={styles.documentName}>{doc.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentationSection;
