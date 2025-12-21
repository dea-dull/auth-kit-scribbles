// src/components/ui/SingleInputModal.jsx
import React, { useState } from 'react';
import TextInputBox from './TextInputBox.jsx';
import WhiteButton from './WhiteButton.jsx';
import styles from './SingleInputModal.module.css';

const SingleInputModal = ({
  title = "Modal Title",
  description = "Enter your details below",
  inputLabel = "Input",
  inputPlaceholder = "",
  buttonLabel = "Submit",
  onSubmit, // async or sync callback receiving the input value
  onClose
}) => {
  const [value, setValue] = useState("");

  const handleClick = async () => {
    if (onSubmit) {
      await onSubmit(value);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose}>×</button>

        <h2>{title}</h2>
        <p>{description}</p>

        <TextInputBox
          label={inputLabel}
          placeholder={inputPlaceholder}
          value={value}
          onChange={e => setValue(e.target.value)}
        />

        <WhiteButton onClick={handleClick}>{buttonLabel}</WhiteButton>
      </div>
    </div>
  );
};

export default SingleInputModal;
