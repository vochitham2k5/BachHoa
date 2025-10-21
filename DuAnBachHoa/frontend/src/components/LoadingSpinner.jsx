import React from 'react';

export default function LoadingSpinner({ size = 24, color = '#0ea5e9' }) {
  const style = {
    width: size,
    height: size,
    border: `${Math.max(2, Math.floor(size/8))}px solid #e5e7eb`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };
  return (
    <div>
      <div style={style} />
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}