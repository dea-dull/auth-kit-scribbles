import React from 'react';
import { Button } from '@mantine/core';
import { Link } from 'react-router-dom';

const GlassButton = ({ to, children, ...rest }) => {
  return (
    <Button
      {...rest}
      component={to ? Link : 'button'}
      to={to}
      variant="filled"
      styles={{
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          color: '#fefae0',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          borderRadius: '6px',
          transition: 'all 0.3s ease',
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }}
    >
      {children}
    </Button>
  );
};

export default GlassButton;
