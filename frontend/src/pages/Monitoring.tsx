import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';

interface Point {
  timestamp: string;
  responseTimeMs: number;
  requests: number;
  errors: number;
  cpuPercent: number;
  memoryPercent: number;
}

const RANGES: { value: string; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

function ChartCard({
  title,
  data,
  dataKey,
  color,
  unit = '',
}: {
  title: string;
  data: Point[];
  dataKey: keyof Point;
  color: string;
  unit?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="mb-3 text-xs text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid stroke="#232328" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            stroke="#8B8B93"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#8B8B93" fontSize={11} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            contentStyle={{ background: '#1A1A1E', border: '1px solid #232328', borderRadius: 6, fontSize: 12 }}
            labelFormatter={(t) => new Date(t).toLocaleString()}
            formatter={(value: number) => [`${value}${unit}`, '']}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Monitoring() {
  const { selectedProject } = useProjects();
  const [range, setRange] = useState('24h');
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    if (!selectedProject) return;
    api
      .get<Point[]>(`/api/monitoring/project/${selectedProject.id}/timeseries?range=${range}`)
      .then(setSeries);
  }, [selectedProject, range]);

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its metrics.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-1">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`rounded-md px-3 py-1 text-xs ${
              range === r.value ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Response time" data={series} dataKey="responseTimeMs" color="#5B8DEF" unit="ms" />
        <ChartCard title="Requests" data={series} dataKey="requests" color="#10B981" />
        <ChartCard title="Errors" data={series} dataKey="errors" color="#EF4444" />
        <ChartCard title="CPU usage" data={series} dataKey="cpuPercent" color="#F5A623" unit="%" />
        <ChartCard title="Memory usage" data={series} dataKey="memoryPercent" color="#8B8B93" unit="%" />
      </div>
    </div>
  );
}
