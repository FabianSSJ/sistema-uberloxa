import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
        <div className="relative w-full">
          <input
            ref={ref}
            type={inputType}
            className={`px-3 py-2.5 bg-white border rounded-md text-[0.9375rem] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${errorClass} ${isPassword ? 'pr-10' : ''} ${widthClass} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              tabIndex={-1}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-sm text-red-500 mt-0.5">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
