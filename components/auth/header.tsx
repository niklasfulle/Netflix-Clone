import { cn } from "@/lib/utils";

interface HeaderProps {
  label: string;
}

export const Header = ({ label }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <h1 className={cn("text-2xl font-semibold text-white")}>🔐 Auth</h1>
      <p className="text-gray-300 text-sm">{label}</p>
    </div>
  );
};
