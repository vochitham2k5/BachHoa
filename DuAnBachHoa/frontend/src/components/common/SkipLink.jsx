import React from 'react';

const SkipLink = ({ href = '#main', label = 'Skip to content' }) => {
  return (
    <a
      href={href}
      className="visually-hidden-focusable position-absolute top-0 start-0 m-2 px-3 py-2 bg-white border rounded"
      style={{ zIndex: 1050 }}
    >
      {label}
    </a>
  );
};

export default SkipLink;
