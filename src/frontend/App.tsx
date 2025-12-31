import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ErrorBoundary } from '@components/ErrorBoundary';
import ProtectedRoute from '@components/ProtectedRoute';
import { UserRole } from '@types';
import Login from '@pages/Login';
import Dashboard from '@pages/Dashboard';
import LandlordDashboard from '@pages/LandlordDashboard';
import BrokerDashboard from '@pages/BrokerDashboard';
import BusinessDetail from '@pages/BusinessDetail';
import PropertyDetail from '@pages/PropertyDetail';
import Messages from '@pages/Messages';
import MarketInsights from '@pages/MarketInsights';
import Settings from '@pages/Settings';
import Profile from '@pages/Profile';
import Applications from '@pages/Applications';
import MetricsDashboard from '@pages/MetricsDashboard';
import Notifications from '@pages/Notifications';
import './index.css';

/**
 * App Component
 *
 * Main application component with routing and global providers
 * - ErrorBoundary wraps entire app to catch rendering errors
 * - AuthProvider provides authentication context
 * - Router handles navigation
 * - Protected routes require authentication
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business/:id"
              element={
                <ProtectedRoute>
                  <BusinessDetail />
                </ProtectedRoute>
              }
            />
            {/* Landlord Dashboard - New route */}
            <Route
              path="/landlord-dashboard"
              element={
                <ProtectedRoute>
                  <LandlordDashboard />
                </ProtectedRoute>
              }
            />
            {/* Broker Dashboard - BROKER role only */}
            <Route
              path="/broker-dashboard"
              element={
                <ProtectedRoute roles={[UserRole.BROKER]}>
                  <BrokerDashboard />
                </ProtectedRoute>
              }
            />
            {/* Backward compatibility redirect for /properties */}
            <Route
              path="/properties"
              element={<Navigate to="/landlord-dashboard" replace />}
            />
            <Route
              path="/property/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trends"
              element={
                <ProtectedRoute>
                  <MarketInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/market-insights"
              element={
                <ProtectedRoute>
                  <MarketInsights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute>
                  <Applications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/metrics"
              element={
                <ProtectedRoute>
                  <MetricsDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
