import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StatsBarChartProps {
  readonly data: ReadonlyArray<{ month: string; movies: number; series: number }>;
}

export default function StatsBarChart({ data }: Readonly<StatsBarChartProps>) {
  return (
    <div className="w-full h-[420px] md:h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
          <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} />
          <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #52525b', color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Bar dataKey="movies" fill="#22d3ee" name="Movies" />
          <Bar dataKey="series" fill="#a78bfa" name="Series" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
