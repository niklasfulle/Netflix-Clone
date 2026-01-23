"use client";

import dynamic from "next/dynamic";
const StatsChart = dynamic(() => import("@/components/admin/StatsChart"), { ssr: false });
const StatsBarChart = dynamic(() => import("@/components/admin/StatsBarChart"), { ssr: false });
import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then(r => r.json());

function TimelineChart({ timeline }: Readonly<{ timeline?: any[] }>) {
  if (timeline && timeline.length > 0) {
    return <StatsChart data={timeline} />;
  }
  return (
    <div className="h-64 flex items-center justify-center text-zinc-400 border-2 border-zinc-700 border-dashed rounded-xl">
      No data available.
    </div>
  );
}

function MonthlyChart({ monthly }: Readonly<{ monthly?: any[] }>) {
  if (monthly && monthly.length > 0) {
    return <StatsBarChart data={monthly} />;
  }
  return (
    <div className="h-64 flex items-center justify-center text-zinc-400 border-2 border-zinc-700 border-dashed rounded-xl">
      No monthly data available.
    </div>
  );
}

function StatisticsContent({ data }: Readonly<{ data: any }>) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-zinc-900/80 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-green-400">{data.totalViews}</div>
          <div className="text-zinc-300 mt-2">Total Views</div>
        </div>
      </div>
      <div className="bg-zinc-900/80 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-200 mb-4">Movies & Series Growth Over Time</h3>
        <TimelineChart timeline={data.timeline} />
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">Movies & Series Added Per Month</h3>
          <MonthlyChart monthly={data.monthly} />
        </div>
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  const { data, isLoading, error } = useSWR("/api/statistics/admin-overview", fetcher);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-zinc-100 tracking-tight">Statistics</h1>
      <div className="bg-zinc-800 rounded-2xl shadow-2xl p-6 border mb-8">
        <h2 className="text-xl font-semibold mb-4 text-zinc-100">Overview</h2>
        {isLoading && <div className="text-zinc-400">Loading...</div>}
        {!isLoading && error && <div className="text-red-400">Error loading statistics.</div>}
        {!isLoading && !error && data && <StatisticsContent data={data} />}
      </div>
    </div>
  );
}
