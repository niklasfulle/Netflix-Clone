import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


interface StatsChartProps {
  readonly data: ReadonlyArray<{ day: string; movies: number; series: number }>;
}

export default function StatsChart({ data }: Readonly<StatsChartProps>) {
  return (
    <div className="w-full h-[420px] md:h-[520px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
          <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} />
          <YAxis stroke="#a1a1aa" fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #52525b', color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Line type="monotone" dataKey="movies" stroke="#22d3ee" strokeWidth={3} dot={false} name="Movies" />
          <Line type="monotone" dataKey="series" stroke="#a78bfa" strokeWidth={3} dot={false} name="Series" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
