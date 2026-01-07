import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TenantImagesGallery } from '@components/broker/TenantImagesGallery';

const mockImages = [
  { id: '1', image_url: 'https://example.com/image1.jpg', display_order: 0 },
  { id: '2', image_url: 'https://example.com/image2.jpg', display_order: 1 },
  { id: '3', image_url: 'https://example.com/image3.jpg', display_order: 2 },
  { id: '4', image_url: 'https://example.com/image4.jpg', display_order: 3 },
  { id: '5', image_url: 'https://example.com/image5.jpg', display_order: 4 },
  { id: '6', image_url: 'https://example.com/image6.jpg', display_order: 5 },
  { id: '7', image_url: 'https://example.com/image7.jpg', display_order: 6 },
];

describe('TenantImagesGallery Component', () => {
  it('renders null when no images provided', () => {
    const { container } = render(
      <TenantImagesGallery images={[]} tenantName="Test Tenant" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders section title', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);
    expect(screen.getByText('Images')).toBeInTheDocument();
  });

  it('displays first 6 images in grid', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const images = screen.getAllByRole('button');
    expect(images).toHaveLength(6);
  });

  it('shows "+X more" overlay when more than 6 images', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('opens lightbox when image is clicked', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const firstImage = screen.getAllByRole('button')[0];
    fireEvent.click(firstImage);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1 / 7')).toBeInTheDocument();
  });

  it('navigates to next image in lightbox', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const firstImage = screen.getAllByRole('button')[0];
    fireEvent.click(firstImage);

    const nextButton = screen.getByLabelText('Next image');
    fireEvent.click(nextButton);

    expect(screen.getByText('2 / 7')).toBeInTheDocument();
  });

  it('navigates to previous image in lightbox', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const firstImage = screen.getAllByRole('button')[0];
    fireEvent.click(firstImage);

    const prevButton = screen.getByLabelText('Previous image');
    fireEvent.click(prevButton);

    // Should wrap around to last image
    expect(screen.getByText('7 / 7')).toBeInTheDocument();
  });

  it('closes lightbox when close button is clicked', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const firstImage = screen.getAllByRole('button')[0];
    fireEvent.click(firstImage);

    const closeButton = screen.getByLabelText('Close gallery');
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes lightbox when backdrop is clicked', () => {
    render(<TenantImagesGallery images={mockImages} tenantName="Test Tenant" />);

    const firstImage = screen.getAllByRole('button')[0];
    fireEvent.click(firstImage);

    const lightbox = screen.getByRole('dialog');
    fireEvent.click(lightbox);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
