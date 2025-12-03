import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const variantClasses = {
    default: 'btn-primary',
    outline: 'btn-outline',
    destructive: 'btn-danger',
    secondary: 'btn-secondary'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };
  
  const classes = clsx(
    'btn',
    variantClasses[variant],
    sizeClasses[size],
    disabled && 'opacity-60 cursor-not-allowed hover:scale-100',
    className
  );
  
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
