"use client";
import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Admin Area</h1>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 border mb-8">
        <p className="text-zinc-300 mb-4">Welcome to the admin area! Here you can find all important management features at a glance.</p>
        <ul className="space-y-4">
          <li>
            <Link href="/admin/users" className="block bg-zinc-900/80 hover:bg-zinc-700/60 transition-all rounded-xl px-6 py-4 text-lg font-semibold text-zinc-100 border border-zinc-700 shadow">
              👤 User Management
              <span className="block text-zinc-400 text-sm font-normal">View, search, block users and see profiles</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/actors" className="block bg-zinc-900/80 hover:bg-zinc-700/60 transition-all rounded-xl px-6 py-4 text-lg font-semibold text-zinc-100 border border-zinc-700 shadow">
              🎭 Actor Management
              <span className="block text-zinc-400 text-sm font-normal">Add, delete actors and see statistics</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/movies" className="block bg-zinc-900/80 hover:bg-zinc-700/60 transition-all rounded-xl px-6 py-4 text-lg font-semibold text-zinc-100 border border-zinc-700 shadow">
              🎬 Movies/Series Management
              <span className="block text-zinc-400 text-sm font-normal">Browse all movies & series, see views and edit</span>
            </Link>
          </li>
          <li>
            <Link href="/admin/statistics" className="block bg-zinc-900/80 hover:bg-zinc-700/60 transition-all rounded-xl px-6 py-4 text-lg font-semibold text-zinc-100 border border-zinc-700 shadow">
              📊 Statistics
              <span className="block text-zinc-400 text-sm font-normal">Usage statistics and system overview</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="text-zinc-400 text-sm text-center">
        <span>Last login: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
