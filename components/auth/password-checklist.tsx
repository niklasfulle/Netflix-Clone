import { Check, Circle } from 'lucide-react';

import { cn } from '@/lib/utils';

type PasswordChecklistProps = Readonly<{
  password: string;
  confirmation: string;
  lengthLabel: string;
  matchLabel: string;
  ariaLabel: string;
}>;

export function PasswordChecklist({
  password,
  confirmation,
  lengthLabel,
  matchLabel,
  ariaLabel,
}: PasswordChecklistProps) {
  const checks = [
    { label: lengthLabel, complete: password.length >= 12 },
    {
      label: matchLabel,
      complete: confirmation.length > 0 && password === confirmation,
    },
  ];

  return (
    <ul className="grid gap-2 text-xs" aria-live="polite" aria-label={ariaLabel}>
      {checks.map(({ label, complete }) => (
        <li key={label} className="flex items-center gap-2">
          {complete ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
          )}
          <span
            data-complete={complete}
            className={cn(complete ? 'text-emerald-300' : 'text-zinc-400')}
          >
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
