import React from 'react';
import { clsx } from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  error?: boolean;
}

export function Textarea({ 
  className = '', 
  error = false, 
  ...props 
}: TextareaProps) {
  const classes = clsx(
    'input min-h-[100px] resize-y',
    error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
    className
  );
  
  return (
    <textarea
      className={classes}
      {...props}
    />
  );
}
