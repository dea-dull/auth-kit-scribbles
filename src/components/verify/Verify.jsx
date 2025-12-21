import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassButton from '../ui/Button.jsx';
import styles from './Verify.module.css'; 

const VerificationResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get('reason') || 'error';
  const [countdown, setCountdown] = useState(18);

  // Decide success/failure and message based on reason
  const getMessage = () => {
    switch (reason) {
      case 'success':
        return {
          isSuccess: true,
          title: '✅ Email Verified Successfully!',
          message: 'Your account has been verified. You can now login with your credentials.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
      case 'expired':
        return {
          isSuccess: false,
          title: '❌ Verification Link Expired',
          message: 'Your verification link has expired. Please request a new one.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
      case 'invalid_token':
        return {
          isSuccess: false,
          title: '❌ Invalid Verification Link',
          message: 'This verification link is invalid. Please use the one from your email or request a new one.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
      case 'already_used':
        return {
          isSuccess: false,
          title: '❌ Link Already Used',
          message: 'This verification link has already been used. Please log in or reset your password.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
      case 'missing_token':
        return {
          isSuccess: false,
          title: '❌ Invalid Verification Link',
          message: 'This verification link is invalid. Please use the one from your email or request a new one.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
      default:
        return {
          isSuccess: false,
          title: '❌ Verification Failed',
          message: 'Something went wrong during verification. Wait a few minutes, then try again.',
          redirectTo: '/login',
          buttonText: 'Go to Login'
        };
    }
  };

  const { isSuccess, title, message, redirectTo, buttonText } = getMessage();

  // Countdown redirect
  useEffect(() => {
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    const timeout = setTimeout(() => navigate(redirectTo), 18000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate, redirectTo]);

  return (
    <div className={isSuccess ? styles.successMessage : styles.errorMessage}>
      <h2>{title}</h2>
      <p>{message}</p>
      <p>
        Redirecting to login in{' '}
        <span className={styles.countdown}>{countdown}</span> seconds...
      </p>
      <GlassButton onClick={() => navigate(redirectTo)}>
        {buttonText}
      </GlassButton>
    </div>
  );
};

export default VerificationResult;
