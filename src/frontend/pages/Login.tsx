import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/LoginModal';
import { SignupModal } from '../components/SignupModal';
import { ProfileCompletionModal } from '../components/ProfileCompletionModal';
import { useAuth } from '@contexts/AuthContext';

/**
 * Login Page
 * Entry point for authentication
 * Displays login and signup modals with profile completion flow
 */
const Login: React.FC = () => {
  const [showLogin, setShowLogin] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupData, setSignupData] = useState<{ email: string; role: string; userId: string } | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLoginSuccess = async (user: any) => {
    // LoginModal already handled the API call, just update context
    setUser({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.profile?.first_name,
      lastName: user.profile?.last_name,
      photoUrl: user.profile?.photo_url,
    });

    // Navigate based on role
    if (user.role === 'tenant') {
      navigate('/dashboard');
    } else if (user.role === 'landlord') {
      navigate('/landlord/dashboard');
    } else if (user.role === 'broker') {
      navigate('/broker/dashboard');
    }
  };

  const handleSignupSuccess = (data: { email: string; role: string; userId: string }) => {
    // After signup, show profile completion modal
    setSignupData(data);
    setShowSignup(false);
    setShowProfileCompletion(true);
  };

  const handleProfileCompleted = async () => {
    // Profile completed, fetch user data and log them in
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.data?.user) {
        const user = data.data.user;

        setUser({
          userId: user.id,
          email: user.email,
          role: user.role,
          firstName: user.profile?.first_name,
          lastName: user.profile?.last_name,
          photoUrl: user.profile?.photo_url,
        });

        // Navigate based on role
        if (user.role === 'tenant') {
          navigate('/dashboard');
        } else if (user.role === 'landlord') {
          navigate('/landlord/dashboard');
        } else if (user.role === 'broker') {
          navigate('/broker/dashboard');
        }
      } else {
        // Fallback: close modal and show login
        setShowProfileCompletion(false);
        setShowLogin(true);
      }
    } catch (error) {
      console.error('Error fetching user after profile completion:', error);
      setShowProfileCompletion(false);
      setShowLogin(true);
    }
  };

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleSwitchToForgotPassword = () => {
    setShowLogin(false);
    setShowForgotPassword(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        marginBottom: '40px',
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
        }}>ZYX Platform</h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.9,
        }}>
          Demand-first commercial real estate marketplace
        </p>
      </div>

      <button
        onClick={() => setShowLogin(true)}
        style={{
          padding: '16px 48px',
          fontSize: '18px',
          fontWeight: '600',
          color: '#667eea',
          background: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Get Started
      </button>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={handleSwitchToSignup}
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={handleSwitchToLogin}
        onSignupSuccess={handleSignupSuccess}
      />

      {signupData && (
        <ProfileCompletionModal
          isOpen={showProfileCompletion}
          onClose={() => {}} // Prevent closing - user must complete profile
          email={signupData.email}
          role={signupData.role}
          onProfileCompleted={handleProfileCompleted}
        />
      )}

      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowForgotPassword(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Password Reset</h2>
            <p>Password reset functionality coming soon</p>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setShowLogin(true);
              }}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
