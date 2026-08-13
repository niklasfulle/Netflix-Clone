import { CheckCircleIcon } from 'lucide-react';

interface FormSuccessProps {
  message?: string;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;

  return (
    <output
      className="mt-4 flex w-full items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-sm leading-5 text-emerald-100"
      aria-live="polite"
    >
      <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
      <p className="break-words">{message}</p>
    </output>
  );
};
