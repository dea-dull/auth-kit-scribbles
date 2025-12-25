import React, { useState } from 'react';
import TextInputBox from '../ui/TextInputBox.jsx';
import PasswordInputBox from '../ui/PasswordInputBox.jsx';
import GlassButton from '../ui/Button.jsx';
import WhiteButton from '../ui/WhiteButton.jsx';
import styles from './Login.module.css';
import { notify } from '../ui/Notify.jsx';
import { useNavigate } from 'react-router-dom';
import SingleInputModal from '../ui/SingleInputModal.jsx';
// import { AuthContext } from '../../context/AuthContext.jsx';

const Login = () => {
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  
    const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
    };


  const handleLogin = async () => {

      if (!isValidEmail(email)) {
    notify.error("Please enter a valid email address.");
    return;
  }

  if (!password) {
    notify.error("Please enter your password.");
    return;
  }

    const API_URL = import.meta.env.VITE_API_URL || "https://your-api-url.com";
  try {
    

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include" // important if backend uses HttpOnly cookies
    });

    const data = await response.json();
    
      if (!response.ok) {
        notify.error(data.message || "Login failed. Please try again later.");
        return;
      }

    
    notify.success("Successfully logged in!");
    navigate('/notes');
    
  } catch (error) {
    console.error("Login error:", error);
    notify.error("Login failed! Check your credentials or verify your account, then try again later.");
  }
};

  const handleForgotPassword = async (emailInput) => {
  const trimmedEmail = emailInput.trim();
  if (!isValidEmail(trimmedEmail)) {
    notify.error("Please enter a valid email address.");
    return;
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || "https://your-api-url.com";

    await fetch(`${API_URL}/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    // Generic response (same regardless of backend result)
    notify.success(
      "If an account exists with this email address, a password reset link has been sent."
    );
    setShowForgotModal(false);
  } catch (error) {
    console.error("Reset password request failed:", error);

    // Still show the same generic response
    notify.success(
      "If an account exists with this email address, a password reset link has been sent."
    );
    setShowForgotModal(false);
  }
};



  const handleResendVerification = async (emailInput) => {
    const trimmedEmail = emailInput.trim();
  if (!isValidEmail(trimmedEmail)) {
    notify.error("Please enter a valid email address.");
    return;
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || "https://your-api-url.com";

    const response = await fetch(`${API_URL}/resend-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: emailInput }),
    });

    // generic message.
    notify.success(
      "If an unverified account exists with this email address, a verification link has been sent."
    );
    setShowVerifyModal(false);
  } catch (error) {
    console.error("If an unverified account exists with this email address, a verification link has been sent.");

    // Still show the *same* generic message
    notify.success(
      "If an unverified account exists with this email address, a verification link has been sent."
    );
    setShowVerifyModal(false);
  }
};



  return (
    <div className={styles.container}>
      <h1>Login</h1>
      <p>Enter your email and password to login to your account</p>

      <TextInputBox
        label="Email"
        placeholder="me@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordInputBox 
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <WhiteButton onClick={handleLogin}>Login</WhiteButton>
      <GlassButton to="/signup">Create an account</GlassButton>

      {/* Forgot Password and Verify Account links side by side */}
      <div className={styles.authLinks}>
        <span
          className={styles.fpSpan}
          onClick={() => setShowForgotModal(true)}
        >
          Reset password
        </span>
        
        <span
          className={styles.fpSpan}
          onClick={() => setShowVerifyModal(true)}
        >
          Verify account
        </span>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <SingleInputModal
          title="Reset Password"
          description="Enter your email to receive a password reset link."
          inputLabel="Email"
          inputPlaceholder="you@example.com"
          buttonLabel="Send Reset Link"
          onSubmit={handleForgotPassword}
          onClose={() => setShowForgotModal(false)}
        />
      )}

      {/* Verify Account Modal */}
      {showVerifyModal && (
        <SingleInputModal
          title="Resend Verification"
          description="Enter your email to receive a new verification link."
          inputLabel="Email"
          inputPlaceholder="you@example.com"
          buttonLabel="Send Verification Link"
          onSubmit={handleResendVerification}
          onClose={() => setShowVerifyModal(false)}
        />
      )}
    </div>
  );
};

export default Login;



























