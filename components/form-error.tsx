import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface FormErrorProps {
  message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;

  return (
    <div
      className="mt-4 flex w-full items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-sm leading-5 text-red-100"
      role="alert"
      aria-live="assertive"
    >
      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
      <p className="break-words">{message}</p>
    </div>
  );
};
