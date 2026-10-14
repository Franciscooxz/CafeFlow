'use client';

import { clsx } from 'clsx';
import { forwardRef, useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-cafe-grayDark">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-gray">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full bg-cafe-white border rounded-xl px-4 py-3 text-cafe-black',
              'placeholder:text-cafe-grayLight text-sm',
              'focus:outline-none focus:ring-2 focus:ring-cafe-terracota/25 focus:border-cafe-terracota',
              'transition-all duration-150',
              icon && 'pl-10',
              error ? 'border-red-400' : 'border-cafe-grayLight',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
