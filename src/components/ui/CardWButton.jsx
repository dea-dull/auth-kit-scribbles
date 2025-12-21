// src/components/ui/CardWButtons.jsx

import React from 'react';
import styles from './Card.module.css';
import GlassButton from './GlassButton';
import WhiteButton from './WhiteButton';

const CardWButtons = ({
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimaryClick,
  onSecondaryClick,
}) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <h2>{title}</h2>
        <div>{message}</div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <WhiteButton onClick={onSecondaryClick}>
            {secondaryLabel}
          </WhiteButton>
          <GlassButton onClick={onPrimaryClick}>
            {primaryLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default CardWButtons;
