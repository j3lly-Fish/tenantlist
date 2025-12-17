import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { UserRole } from '@types';

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[]; // Allowed roles, if not specified any authenticated user can access
  redirectTo?: string; // Where to redirect if not authenticated
}

/**
 * ProtectedRoute Component
 *
 * Protects routes that require authentication and/or specific roles
 * - Checks authentication status
 * - Checks user role if roles prop is provided
 * - Redirects to login if not authenticated
 * - Redirects to appropriate page if wrong role
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles,
  redirectTo = '/',
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666',
      }}>
        Loading...
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role if roles are specified
  if (roles && roles.length > 0 && role) {
    if (!roles.includes(role)) {
      // User has wrong role - redirect to appropriate dashboard
      return <Navigate to={getRoleDashboard(role)} replace />;
    }
  }

  // User is authenticated and has correct role
  return <>{children}</>;
};

/**
 * Get appropriate dashboard URL for user role
 */
function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case UserRole.TENANT:
      return '/dashboard';
    case UserRole.LANDLORD:
      return '/landlord-dashboard'; // Placeholder for future implementation
    case UserRole.BROKER:
      return '/broker-dashboard'; // Placeholder for future implementation
    default:
      return '/';
  }
}

export default ProtectedRoute;
