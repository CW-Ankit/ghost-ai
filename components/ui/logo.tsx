import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  variant?: 'filled' | 'outline';
  color?: string;
}

export function Logo({ 
  className = '', 
  size = 24, 
  variant = 'filled', 
  color 
}: LogoProps) {
  const defaultColor = color || 'currentColor';
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <path 
        d="M12 2C7.58172 2 4 5.58172 4 10V17C4 18.6569 5.34315 20 7 20H9L10 18L11 20H13L14 18H15C16.6569 20 18 18.6569 18 17V10C18 5.58172 14.4183 2 12 2Z" 
        fill={variant === 'filled' ? defaultColor : 'none'} 
        stroke={defaultColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <circle cx="9" cy="11" r="1" fill={defaultColor} />
      <circle cx="15" cy="11" r="1" fill={defaultColor} />
    </svg>
  );
}
