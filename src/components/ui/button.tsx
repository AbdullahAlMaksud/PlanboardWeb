'use client';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm',
    destructive: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-sm px-5 py-2.5',
    icon: 'p-1.5',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
