import React from 'react';
import styles from './Card.module.css';

const Card = ({ title, message, onClose }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2>{title}</h2>
        <div>{message}</div>

        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
    </div>
  );
};

export default Card;
