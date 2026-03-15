import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card-base ${className}`} {...props}>
      {children}
    </div>
  );
};
