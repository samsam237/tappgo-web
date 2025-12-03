import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: boolean;
}

export function Input({ className = '', error = false, ...props }: InputProps) {
  const classes = clsx(
    'form-control',
    error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
    className
  );
  
  return (
    <input className={classes} {...props} />
  );
}
