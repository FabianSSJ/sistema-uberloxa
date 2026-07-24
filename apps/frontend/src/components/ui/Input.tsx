import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', ...props }, ref) => {
    const widthClass = fullWidth ? 'w-full' : '';
    const errorClass = error 
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400';

    return (
      <div className={`flex flex-col gap-1.5 ${widthClass}`}>
        {label && (
          <label className="text-sm font-semibold text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`px-3 py-2.5 bg-white border rounded-md text-[0.9375rem] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${errorClass} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-sm text-red-500 mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
