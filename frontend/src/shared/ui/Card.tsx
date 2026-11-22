import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#FDFBF7] rounded-[24px] border border-[#EAE1D3] shadow-amber-soft overflow-hidden transition-all duration-200',
          hoverEffect &&
            'hover:shadow-[0_16px_36px_-6px_rgba(160,130,100,0.14)] hover:border-[#DECDBA] hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
