import React, { useState } from 'react';
import { TextInput, ActionIcon } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

const PasswordInputBox = ({
  placeholder = "Your password",
  value,
  onChange,
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <TextInput
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant="filled"
      style={{ width: '100%' }}
      rightSection={
        <ActionIcon
          radius="xl"
          variant="default"
          size={32}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            background: 'none', // Custom dark background
            color: hovered ? '#FFD700' : '#e0e0e0', // Icon color
            transition: 'color 0.2s',
	    border: 'none',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {visible
            ? <IconEyeOff size="1rem" color={hovered ? "#FFD700" : "#e0e0e0"} />
            : <IconEye size="1rem" color={hovered ? "#FFD700" : "#e0e0e0"} />
          }
        </ActionIcon>
      }
      styles={{
        input: {
          backgroundColor: '#121212',
          color: '#e0e0e0',
          border: '1px solid #2a2a2a',
          paddingRight: '2.75rem',
          borderRadius: '5px',
          height: '15px',
          fontSize: '14px',
        },
      }}
      {...props}
    />
  );
};

export default PasswordInputBox;
