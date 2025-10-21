import React from 'react';

const variants = {
  primary: { backgroundColor: '#0ea5e9', color: '#fff' },
  secondary: { backgroundColor: '#e5e7eb', color: '#111827' },
  danger: { backgroundColor: '#ef4444', color: '#fff' },
  outline: { backgroundColor: 'transparent', color: '#0ea5e9', border: '1px solid #0ea5e9' },
};

const sizes = {
  sm: { padding: '6px 10px', fontSize: 13 },
  md: { padding: '8px 14px', fontSize: 14 },
  lg: { padding: '10px 16px', fontSize: 16 },
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  style = {},
  ...props
}) {
  const base = {
    border: 'none',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all .15s ease',
    width: fullWidth ? '100%' : undefined,
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...s, ...v, ...style }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}