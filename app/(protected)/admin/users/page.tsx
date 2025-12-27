"use client";
import { useEffect, useState } from "react";
import UserBlockButton from "@/components/admin/UserBlockButton";
import useCurrentUser from "@/hooks/useCurrentUser";

export default function AdminUsersPage() {
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockChange = (userId: string, blocked: boolean) => {
    setUsers(users => users.map(u => u.id === userId ? { ...u, isBlocked: blocked } : u));
    setSuccess(blocked ? "User blocked!" : "User unblocked!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortKey];
    let bValue = b[sortKey];
    if (sortKey === "createdAt") {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">User Management</h1>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 items-stretch md:items-end">
        <input
          className="border border-zinc-700 rounded-lg px-4 py-3 bg-zinc-900 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all shadow-sm placeholder:text-zinc-400"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="min-h-6 mb-4">
        {error && <div className="text-red-400 animate-pulse font-medium">{error}</div>}
        {success && <div className="text-green-400 animate-pulse font-medium">{success}</div>}
      </div>
      <div className=" bg-zinc-800 rounded-2xl shadow-2xl p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">All Users</h2>
        {loading ? (
          <div className="text-zinc-400">loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-zinc-400">No users found.</div>
        ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-1">
              <thead>
                <tr className="bg-zinc-900/80">
                  <th className="py-3 px-4 rounded-l-xl text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("name")}>Name {sortKey === "name" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("email")}>Email {sortKey === "email" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("role")}>Role {sortKey === "role" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("createdAt")}>Created {sortKey === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold">Profiles</th>
                  <th className="py-3 px-4 text-zinc-300 font-bold cursor-pointer select-none" onClick={() => handleSort("isBlocked")}>Status {sortKey === "isBlocked" && (sortDirection === "asc" ? "▲" : "▼")}</th>
                  <th className="py-3 px-4 rounded-r-xl text-zinc-300 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr key={user.id} className="bg-zinc-800/80 hover:bg-zinc-700/60 transition-all">
                    <td className="py-2 px-4 font-medium text-zinc-100">{user.name}</td>
                    <td className="py-2 px-4 text-zinc-200">{user.email}</td>
                    <td className="py-2 px-4 text-zinc-200">{user.role}</td>
                    <td className="py-2 px-4 text-zinc-200">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-4 text-zinc-200">
                      {user.profiles && user.profiles.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {user.profiles.map((p: any) => (
                            <li key={p.id} className="mb-1">
                              <span className="font-semibold">{p.name}</span>
                              {p.inUse && <span className="ml-2 text-green-400">(aktiv)</span>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-zinc-400">No profiles</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-zinc-200">
                      {user.isBlocked ? <span className="text-red-400">Blocked</span> : <span className="text-green-400">Active</span>}
                    </td>
                    <td className="py-2 px-4">
                      {currentUser?.id !== user.id && (
                        <UserBlockButton userId={user.id} isBlocked={user.isBlocked} onChange={blocked => handleBlockChange(user.id, blocked)} />
                      )}
                      {currentUser?.id === user.id && (
                        <span className="text-zinc-400">(own account)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded bg-zinc-700 text-zinc-300 disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              &lt;
            </button>
            <span className="text-zinc-300">Seite {page} / {totalPages}</span>
            <button
              className="px-3 py-1 rounded bg-zinc-700 text-zinc-300 disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
            >
              &gt;
            </button>
          </div>
        </>
        )}
      </div>
    </div>
  );
}
