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
          'bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden',
          hoverEffect && 'transition-all duration-200 hover:shadow-md hover:border-amber-200',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
