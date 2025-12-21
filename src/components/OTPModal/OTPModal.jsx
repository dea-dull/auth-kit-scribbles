import React, { useState } from 'react';
import styles from './OTPModal.module.css';

const OTPModal = ({
  message = "Enter your 6-digit code.",
  heading = "Verify",
  onClose,
  onVerify,
  onResend,
  showResend = false, // default: don't show
  showEmail = false,  // default: don't show
  email = ""
}) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2>{heading}</h2>
        <p>{message}</p>
        {showEmail && (
          <p style={{ fontSize: "0.98rem", color: "#8ef58a" }}>
            {email}
          </p>
        )}
        <div className={styles.otpInputs}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              id={`otp-${idx}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              className={styles.otpBox}
              autoFocus={idx === 0}
            />
          ))}
        </div>
        <button
          className={styles.verifyBtn}
          onClick={() => onVerify(otp.join(""))}
          disabled={otp.join("").length < 6}
        >
          Verify
        </button>
        {showResend && (
          <p className={styles.resend}>
            Didn’t get the code? <span onClick={onResend}>Resend code</span>
          </p>
        )}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default OTPModal;