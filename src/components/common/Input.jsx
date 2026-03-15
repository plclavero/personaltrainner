import React from 'react';

export const Input = ({ label, className = '', ...props }) => {
  return (
    <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: 'var(--space-xs)', 
          fontSize: '0.875rem', 
          fontWeight: 600,
          color: 'var(--color-text-muted)'
        }}>
          {label}
        </label>
      )}
      <input className={`input-base ${className}`} {...props} />
    </div>
  );
};
