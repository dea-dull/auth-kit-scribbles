import React, { useState } from 'react';
import TextInputBox from '../ui/TextInputBox.jsx';
import PasswordInputBox from '../ui/PasswordInputBox.jsx';
import GlassButton from '../ui/Button.jsx';
import WhiteButton from '../ui/WhiteButton.jsx';
import styles from './SignUp.module.css';
import PasswordStrength from '../ui/PasswordStrength.jsx';
import { notify } from '../ui/Notify.jsx';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card.jsx';


const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


const isValidPassword = (password) => {
  // Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return passwordRegex.test(password);
};



const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showVerificationCard, setShowVerificationCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle initial signup - UPDATED
  const handleSignUp = async () => {


    if (!isValidEmail(email)) {
    notify.error("Please enter a valid email address.");
    return;
    }

    if (!isValidPassword(password)) {
    notify.error("Password does not meet requirement.");
    return;
    }
    if (password !== confirmPassword) {
      notify.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Call YOUR backend API instead of Amplify signUp
      const API_URL = import.meta.env.VITE_API_URL || 'https://your-api-url.com';
      
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Show verification card
        setShowVerificationCard(true);
        notify.success("Sign up completed successfully! Check your email for the verification link.");
      } else {
        throw new Error('Signup failed. ');
      }
    } catch (error) {
      console.error('Signup error:', error);
      
        notify.error("Sign-up failed. Please check your details and try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle closing verification card - UPDATED
  const handleCloseCard = () => {
    setShowVerificationCard(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    navigate('/login');
  };

 

  return (
    <div className={styles.container}>
      <h1>Create an account</h1>
      <p>Enter your email and password to create an account</p>

      <TextInputBox
	/*id="email"
 	name="email"*/
        placeholder="me@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
	autoComplete="email"
      />
      <div>
        <PasswordInputBox
	  id="password"
 	  name="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
	  autoComplete="new-password" 
        />
        <PasswordStrength password={password} />
      </div>
      <PasswordInputBox
	 id="confirmPassword"
	 name="confirmPassword"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
	autoComplete="new-password"
        style={{ marginTop: '0.7rem' }}
      />

      <WhiteButton onClick={handleSignUp} disabled={loading}>
        {loading ? 'Creating Account...' : 'Create an account'}
      </WhiteButton>
      <GlassButton to="/login">Login</GlassButton>

      {/* Verification card after signup - UPDATED MESSAGE */}
      {showVerificationCard && (
        <Card
          title="Verify Your Account"
          message={<>A <strong>magic link</strong> has been sent to <span style={{ color: "#FFD700" }}>{email}</span>. Click the link in your email to verify your account.</>}
          onClose={handleCloseCard}
        />
      )}

     </div>
  );
};

export default SignUp;
