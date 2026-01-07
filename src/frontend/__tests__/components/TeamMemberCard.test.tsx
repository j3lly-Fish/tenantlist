import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamMemberCard, TeamMember } from '../../components/broker/TeamMemberCard';

describe('TeamMemberCard', () => {
  const mockMember: TeamMember = {
    id: 'test-1',
    name: 'John Doe',
    location: 'Dallas, TX',
    role: 'broker',
    email: 'john@example.com',
  };

  const mockOnUpdate = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render member information', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dallas, TX')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Broker')).toBeInTheDocument();
  });

  it('should display avatar with first letter of name', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should display "?" when name is empty', () => {
    const emptyMember: TeamMember = {
      ...mockMember,
      name: '',
    };

    render(
      <TeamMemberCard
        member={emptyMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should call onUpdate when name changes', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ name: 'Jane Smith' });
  });

  it('should call onUpdate when email changes', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const emailInput = screen.getByDisplayValue('john@example.com');
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ email: 'jane@example.com' });
  });

  it('should call onUpdate when location changes', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const locationInput = screen.getByDisplayValue('Dallas, TX');
    fireEvent.change(locationInput, { target: { value: 'Austin, TX' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ location: 'Austin, TX' });
  });

  it('should call onUpdate when role changes', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const roleSelect = screen.getByDisplayValue('Broker');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({ role: 'admin' });
  });

  it('should call onRemove when remove button is clicked', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByRole('button', { name: /Remove team member/i });
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('should render all role options', () => {
    render(
      <TeamMemberCard
        member={mockMember}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const roleSelect = screen.getByDisplayValue('Broker');
    const options = roleSelect.querySelectorAll('option');

    expect(options).toHaveLength(4);
    expect(screen.getByRole('option', { name: 'Broker' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeInTheDocument();
  });
});
