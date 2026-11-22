import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[#6E6862] mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-4 py-3 rounded-2xl border bg-[#FDFBF7] text-[#1F1E1D] placeholder-[#A49C94] text-sm shadow-ivory-inset transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                : 'border-[#DECFC0] focus:border-[#B84A1C] focus:ring-[#B84A1C]/20',
              className
            )
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[#8C827A]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
