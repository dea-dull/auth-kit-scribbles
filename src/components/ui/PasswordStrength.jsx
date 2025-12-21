import React from 'react';
import styles from './PasswordStrength.module.css';

const requirements = [
  { label: 'Length', test: (pw) => pw.length >= 8 },
  { label: 'Uppercase characters', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Lowercase characters', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Special characters', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
];

const CheckIcon = ({ color = "#43a047" }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{display: 'inline', verticalAlign: 'middle'}} fill="none">
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M6 10.5l2.5 2.5 5-5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CrossIcon = ({ color = "#e53935" }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{display: 'inline', verticalAlign: 'middle'}} fill="none">
    <circle cx="10" cy="10" r="9" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  
  // Calculate how many requirements are passed
  const passedCount = requirements.filter(req => req.test(password)).length;
  // Calculate progress percentage (0-100)
  const progressPercentage = (passedCount / requirements.length) * 100;
  
  // Determine strength level
  const strengthLevel = Math.min(
    Math.floor(passedCount / (requirements.length / 4)), 
    4
  );

  return (
    <div>
      <div className={styles.progressWrapper}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`${styles.progressSegment} ${
              i < strengthLevel ? styles.active : ''
            } ${
              strengthLevel === 4 ? styles.complete : ''
            }`}
          />
        ))}
      </div>
      <ul className={styles.requirements}>
        {requirements.map((req, idx) => {
          const passed = req.test(password);
          return (
            <li key={idx} className={passed ? styles.pass : styles.fail}>
              {passed ? <CheckIcon color="#43a047" /> : <CrossIcon color="#e53935" />}
              <span>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrength;
