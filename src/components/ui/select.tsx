'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = 'Sélectionner...',
  options,
  disabled = false,
  className = '',
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === selectedValue);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="input w-full flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-strong max-h-60 overflow-auto animate-fade-in-up">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && handleSelect(option.value)}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedValue === option.value 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-500' 
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SelectTrigger({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`input w-full flex items-center justify-between cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-400">{placeholder}</span>;
}

export function SelectContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-strong max-h-60 overflow-auto animate-fade-in-up ${className}`}>
      {children}
    </div>
  );
}

export function SelectItem({ 
  value, 
  children, 
  onSelect,
  className = '' 
}: { 
  value: string; 
  children: React.ReactNode; 
  onSelect?: (value: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-900 ${className}`}
    >
      {children}
    </button>
  );
}
