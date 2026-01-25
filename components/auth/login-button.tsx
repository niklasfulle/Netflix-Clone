"use client";

import { useRouter } from 'next/navigation';

interface LoginButtonProps {
  children: React.ReactNode;
  mode?: "modal" | "redirect";
}

export const LoginButton = ({
  children,
  mode = "redirect",
}: LoginButtonProps) => {
  const router = useRouter();

  const onClick = () => {
    router.push("/auth/login");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  if (mode === "modal") {
    return <span>TODO: Implement modal</span>;
  }
  return (
    <button
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="cursor-pointer bg-transparent border-none p-0"
    >
      {children}
    </button>
  );
};
