/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, within } from '@testing-library/react';
import { PropertyGallery, GalleryItem } from '../components/PropertyGallery';
import { ContactAgentSidebar, AgentInfo } from '../components/ContactAgentSidebar';

// Mock gallery items
const mockGalleryItems: GalleryItem[] = [
  { url: 'https://example.com/image1.jpg', caption: 'Main entrance' },
  { url: 'https://example.com/image2.jpg', caption: 'Lobby' },
  { url: 'https://example.com/image3.jpg', caption: 'Office space' },
  { url: 'https://example.com/image4.jpg', caption: 'Meeting room' },
  { url: 'https://example.com/image5.jpg', caption: 'Break room' },
  { url: 'https://example.com/image6.jpg', caption: 'Parking' },
];

const mockGalleryWithVideo: GalleryItem[] = [
  { url: 'https://example.com/image1.jpg' },
  { url: 'https://example.com/video.mp4', isVideo: true, thumbnailUrl: 'https://example.com/video-thumb.jpg' },
  { url: 'https://example.com/image2.jpg' },
  { url: 'https://example.com/image3.jpg' },
];

// Mock agent info
const mockAgent: AgentInfo = {
  name: 'John Smith',
  company: 'CBRE',
  photoUrl: 'https://example.com/agent.jpg',
  email: 'john.smith@cbre.com',
  phone: '(305) 555-1234',
};

const mockAgentWithoutPhoto: AgentInfo = {
  name: 'Jane Doe',
  company: 'Cushman & Wakefield',
};

describe('PropertyGallery', () => {
  it('should render hero image', () => {
    render(<PropertyGallery items={mockGalleryItems} propertyTitle="Test Property" />);

    // Get hero container and check it contains the hero image
    const heroContainer = document.querySelector('.heroContainer');
    expect(heroContainer).toBeInTheDocument();

    const heroImage = heroContainer?.querySelector('.heroImage');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('should render 4 thumbnails below hero', () => {
    render(<PropertyGallery items={mockGalleryItems} propertyTitle="Test Property" />);

    // Should have 4 thumbnail buttons
    const thumbnailButtons = screen.getAllByRole('button');
    expect(thumbnailButtons).toHaveLength(4);
  });

  it('should change hero image when clicking thumbnail', () => {
    render(<PropertyGallery items={mockGalleryItems} propertyTitle="Test Property" />);

    // Click the second thumbnail
    const thumbnailButtons = screen.getAllByRole('button');
    fireEvent.click(thumbnailButtons[1]);

    // Hero image should now show the second image
    const heroContainer = document.querySelector('.heroContainer');
    const heroImage = heroContainer?.querySelector('.heroImage');
    expect(heroImage).toBeInTheDocument();
    expect(heroImage).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('should show play icon overlay on video thumbnail', () => {
    render(<PropertyGallery items={mockGalleryWithVideo} propertyTitle="Test Property" />);

    const playIcon = screen.getByTestId('play-icon');
    expect(playIcon).toBeInTheDocument();
  });

  it('should show +N indicator when there are more than 4 images', () => {
    render(<PropertyGallery items={mockGalleryItems} propertyTitle="Test Property" />);

    const moreIndicator = screen.getByTestId('more-indicator');
    expect(moreIndicator).toBeInTheDocument();
    expect(moreIndicator).toHaveTextContent('+2');
  });

  it('should render placeholder when no items provided', () => {
    render(<PropertyGallery items={[]} propertyTitle="Empty Property" />);

    const heroImage = screen.getByAltText('Empty Property');
    expect(heroImage).toBeInTheDocument();
  });

  it('should not show thumbnail row when only one image', () => {
    render(
      <PropertyGallery
        items={[{ url: 'https://example.com/single.jpg' }]}
        propertyTitle="Single Image Property"
      />
    );

    const thumbnailButtons = screen.queryAllByRole('button');
    expect(thumbnailButtons).toHaveLength(0);
  });
});

describe('ContactAgentSidebar', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnSendQFP = jest.fn();
  const mockOnDecline = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render agent photo, name, and company', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    const agentPhoto = screen.getByAltText('John Smith');
    expect(agentPhoto).toBeInTheDocument();
    expect(agentPhoto).toHaveAttribute('src', 'https://example.com/agent.jpg');

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('CBRE')).toBeInTheDocument();
  });

  it('should render avatar with initials when no photo provided', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgentWithoutPhoto}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    const avatar = screen.getByTestId('agent-avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveTextContent('JD');
  });

  it('should render Send Message, Send QFP, and Decline buttons', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send qfp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it('should call onSendMessage when Send Message button is clicked', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /send message/i }));
    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
  });

  it('should call onSendQFP when Send QFP button is clicked', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /send qfp/i }));
    expect(mockOnSendQFP).toHaveBeenCalledTimes(1);
  });

  it('should call onDecline when Decline button is clicked', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(mockOnDecline).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /send qfp/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled();
  });

  it('should render contact details when provided', () => {
    render(
      <ContactAgentSidebar
        agent={mockAgent}
        onSendMessage={mockOnSendMessage}
        onSendQFP={mockOnSendQFP}
        onDecline={mockOnDecline}
      />
    );

    const emailLink = screen.getByText('john.smith@cbre.com');
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:john.smith@cbre.com');

    const phoneLink = screen.getByText('(305) 555-1234');
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute('href', 'tel:(305) 555-1234');
  });
});
