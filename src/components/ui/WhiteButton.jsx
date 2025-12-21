// src/components/ui/WhiteButton.jsx

import React from 'react';
import { Button } from '@mantine/core';

const WhiteButton = (props) => {
  return (
    <Button
      {...props}
      variant="filled"
      styles={{
        root: {
          backgroundColor: '#ffffff',
          color: '#2f2f2f', // near-black text for contrast
          border: '0.5px solid #ddd', // faint border for visibility
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
          borderRadius: '5px',
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5'; // soft light grey on hover
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
      }}
    />
  );
};

export default WhiteButton;
