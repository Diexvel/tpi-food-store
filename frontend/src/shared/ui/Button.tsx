import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-tight';

  const variants = {
    primary:
      'bg-[#B84A1C] hover:bg-[#A23F15] active:bg-[#8D350F] text-white focus:ring-[#B84A1C]/50 shadow-amber-pill active:scale-[0.98]',
    secondary:
      'bg-[#FDFBF7] hover:bg-[#F3EDE2] text-[#1F1E1D] border border-[#E2D6C5] focus:ring-[#B84A1C]/30 shadow-xs active:scale-[0.98]',
    danger:
      'bg-[#BF3E34] hover:bg-[#A9342B] text-white focus:ring-[#BF3E34]/40 shadow-xs active:scale-[0.98]',
    outline:
      'border border-[#DECFC0] hover:bg-[#F5EDE3] text-[#2D2A26] focus:ring-[#B84A1C]/30',
    ghost:
      'hover:bg-[#EFE6DA] text-[#6E6862] hover:text-[#1F1E1D] focus:ring-[#B84A1C]/20',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl',
    md: 'text-sm px-5 py-2.5 gap-2 rounded-2xl',
    lg: 'text-base px-6 py-3.5 gap-2.5 rounded-2xl',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
};
