// src/components/ui/TextInputBox.jsx

import React from 'react';
import { TextInput } from '@mantine/core';

const TextInputBox = ({
  label,
  placeholder = 'Email',
  value,
  onChange,
  ...props
}) => {
  return (
    <TextInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="filled"
      style={{ width: '100%' }}
      styles={{
        input: {
          backgroundColor: '#121212',
          color: '#e0e0e0',
          border: '1px solid #2a2a2a',
          paddingRight: '2.75rem',
          borderRadius: '5px',
          height: '15px',
          fontSize: '14px',
	 '&::placeholder': {
      color: '#a0a0a0',
       opacity: 1,
    },
        },
      }}
      {...props}
    />
  );
};

export default TextInputBox;
