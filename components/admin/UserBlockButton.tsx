import { useState } from "react";

export default function UserBlockButton({ userId, isBlocked, onChange }: { userId: string; isBlocked: boolean; onChange: (blocked: boolean) => void }) {
  const [loading, setLoading] = useState(false);
  const handleBlock = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, block: !isBlocked }),
    });
    setLoading(false);
    if (res.ok) {
      onChange(!isBlocked);
    }
  };
  return (
    <button
      className={`px-4 py-2 rounded-md text-white font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-600 ${isBlocked ? "bg-green-600 hover:bg-green-800" : "bg-red-600 hover:bg-red-800"}`}
      onClick={handleBlock}
      disabled={loading}
    >
      {isBlocked ? "Entsperren" : "Sperren"}
    </button>
  );
}
