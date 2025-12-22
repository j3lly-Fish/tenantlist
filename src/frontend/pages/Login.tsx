import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/LoginModal';
import { SignupModal } from '../components/SignupModal';
import { ProfileCompletionModal } from '../components/ProfileCompletionModal';
import { PublicNavigation } from '../components/PublicNavigation';
import {
  HeroSection,
  HowItWorks,
  BenefitsTabs,
  WhyChoose,
  Testimonials,
  Footer,
} from '../components/LandingPage';
import { useAuth } from '@contexts/AuthContext';
import styles from './Login.module.css';

type UserRole = 'tenant' | 'landlord' | 'broker';

/**
 * Login Page
 * Full marketing landing page with authentication modals
 * Displays: PublicNavigation > Hero > HowItWorks > Benefits > WhyChoose > Testimonials > Footer
 */
const Login: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupData, setSignupData] = useState<{ email: string; role: string; userId: string } | null>(null);
  const [initialSignupRole, setInitialSignupRole] = useState<UserRole | null>(null);
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

  // Navigation callbacks
  const handleSignIn = useCallback(() => {
    setShowSignup(false);
    setShowLogin(true);
    setInitialSignupRole(null);
  }, []);

  const handleGetStarted = useCallback(() => {
    setShowLogin(false);
    setInitialSignupRole(null);
    setShowSignup(true);
  }, []);

  // Switch modal handlers
  const handleSwitchToSignup = useCallback(() => {
    setShowLogin(false);
    setInitialSignupRole(null);
    setShowSignup(true);
  }, []);

  const handleSwitchToLogin = useCallback(() => {
    setShowSignup(false);
    setInitialSignupRole(null);
    setShowLogin(true);
  }, []);

  const handleSwitchToForgotPassword = useCallback(() => {
    setShowLogin(false);
    setShowForgotPassword(true);
  }, []);

  // Hero section CTA callbacks with role pre-selection
  const handleFindSpace = useCallback(() => {
    setShowLogin(false);
    setInitialSignupRole('tenant');
    setShowSignup(true);
  }, []);

  const handleListProperty = useCallback(() => {
    setShowLogin(false);
    setInitialSignupRole('landlord');
    setShowSignup(true);
  }, []);

  // Benefits section callback
  const handleBenefitsGetStarted = useCallback(() => {
    setShowLogin(false);
    setInitialSignupRole(null);
    setShowSignup(true);
  }, []);

  return (
    <div className={styles.landingPage}>
      {/* Public Navigation Header */}
      <PublicNavigation
        onSignIn={handleSignIn}
        onGetStarted={handleGetStarted}
      />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Hero Section */}
        <HeroSection
          onFindSpace={handleFindSpace}
          onListProperty={handleListProperty}
        />

        {/* How It Works Section */}
        <div id="how-it-works">
          <HowItWorks />
        </div>

        {/* Benefits Tabs Section */}
        <div id="benefits">
          <BenefitsTabs onGetStarted={handleBenefitsGetStarted} />
        </div>

        {/* Why Choose ZYX Section */}
        <div id="pricing">
          <WhyChoose />
        </div>

        {/* Testimonials Section */}
        <div id="testimonials">
          <Testimonials />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Authentication Modals */}
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
        initialRole={initialSignupRole}
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
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowForgotPassword(false)}
        >
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Password Reset</h2>
            <p className={styles.modalText}>Password reset functionality coming soon</p>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setShowLogin(true);
              }}
              className={styles.modalButton}
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
