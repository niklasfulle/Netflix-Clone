import * as React from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import { AuthInput, type AuthInputProps } from '@/components/auth/auth-input';
import { Button } from '@/components/ui/button';

type AuthPasswordInputProps = Omit<AuthInputProps, 'endAdornment' | 'icon' | 'type'> & {
  showPasswordLabel: string;
  hidePasswordLabel: string;
  capsLockMessage: string;
};

export const AuthPasswordInput = React.forwardRef<HTMLInputElement, AuthPasswordInputProps>(
  (
    {
      showPasswordLabel,
      hidePasswordLabel,
      capsLockMessage,
      onBlur,
      onKeyDown,
      onKeyUp,
      ...props
    },
    ref,
  ) => {
    const [passwordVisible, setPasswordVisible] = React.useState(false);
    const [capsLockActive, setCapsLockActive] = React.useState(false);

    const updateCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
      setCapsLockActive(event.getModifierState('CapsLock'));
    };

    return (
      <div className="space-y-2">
        <AuthInput
          {...props}
          ref={ref}
          icon={LockKeyhole}
          type={passwordVisible ? 'text' : 'password'}
          onKeyDown={(event) => {
            updateCapsLock(event);
            onKeyDown?.(event);
          }}
          onKeyUp={(event) => {
            updateCapsLock(event);
            onKeyUp?.(event);
          }}
          onBlur={(event) => {
            setCapsLockActive(false);
            onBlur?.(event);
          }}
          endAdornment={(
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}
        />
        {capsLockActive ? (
          <output className="block text-xs font-medium text-amber-300" aria-live="polite">
            {capsLockMessage}
          </output>
        ) : null}
      </div>
    );
  },
);

AuthPasswordInput.displayName = 'AuthPasswordInput';
