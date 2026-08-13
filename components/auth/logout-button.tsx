"use client";

import { logout } from '@/actions/logout';

interface LogoutButtonProps {
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const LogoutButton = ({ children, className, 'aria-label': ariaLabel }: LogoutButtonProps) => {
  const onClick = () => {
    logout();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`cursor-pointer ${className ?? ''}`.trim()}
    >
      {children}
    </button>
  );
};
