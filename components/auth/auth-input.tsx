import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AuthInputProps extends InputProps {
  icon: LucideIcon;
  endAdornment?: React.ReactNode;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, icon: Icon, endAdornment, ...props }, ref) => (
    <div className="group relative">
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-red-400"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        className={cn(
          'h-12 rounded-xl border-white/10 bg-white/[0.06] px-4 pl-11 text-base text-white shadow-inner shadow-black/10 placeholder:text-zinc-500 hover:border-white/20 focus-visible:border-red-400 focus-visible:ring-2 focus-visible:ring-red-500/25 disabled:bg-white/[0.03]',
          endAdornment && 'pr-12',
          className,
        )}
        {...props}
      />
      {endAdornment ? (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</div>
      ) : null}
    </div>
  ),
);

AuthInput.displayName = 'AuthInput';
