/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import { DocumentationSection } from '../components/DocumentationSection';

describe('DocumentationSection', () => {
  const mockDocuments = [
    { name: 'Aventura Park Blueprints.pdf', url: '/docs/blueprints.pdf' },
    { name: 'Zoning & Use Permits.pdf', url: '/docs/zoning.pdf' },
    { name: 'Environmental Reports.pdf', url: '/docs/environmental.pdf' },
    { name: 'Certificate of Occupancy.pdf', url: '/docs/certificate.pdf' },
  ];

  it('should render section title "Documentation"', () => {
    render(<DocumentationSection documents={mockDocuments} />);

    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('should render 4 document links with PDF icons', () => {
    render(<DocumentationSection documents={mockDocuments} />);

    // Check all document names are present
    expect(screen.getByText('Aventura Park Blueprints.pdf')).toBeInTheDocument();
    expect(screen.getByText('Zoning & Use Permits.pdf')).toBeInTheDocument();
    expect(screen.getByText('Environmental Reports.pdf')).toBeInTheDocument();
    expect(screen.getByText('Certificate of Occupancy.pdf')).toBeInTheDocument();

    // Check PDF icons are present (by test id)
    const pdfIcons = screen.getAllByTestId('pdf-icon');
    expect(pdfIcons).toHaveLength(4);
  });

  it('should render document links as clickable anchors that open in new tab', () => {
    render(<DocumentationSection documents={mockDocuments} />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);

    // Check each link has correct attributes
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    // Check specific URLs
    expect(screen.getByText('Aventura Park Blueprints.pdf').closest('a')).toHaveAttribute('href', '/docs/blueprints.pdf');
    expect(screen.getByText('Zoning & Use Permits.pdf').closest('a')).toHaveAttribute('href', '/docs/zoning.pdf');
  });

  it('should render empty state when no documents provided', () => {
    render(<DocumentationSection documents={[]} />);

    // Section title should still be present
    expect(screen.getByText('Documentation')).toBeInTheDocument();

    // Empty state message should appear
    expect(screen.getByText('No documents available')).toBeInTheDocument();

    // No links should be present
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
  });
});
