"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const CHART_COLORS = ["#155A3F", "#3DB67F", "#F59E0B", "#2563EB", "#DC2626", "#7C3AED"];
const tip = { contentStyle: { borderRadius: 12, border: "1px solid #D5E8DE", fontSize: 12, boxShadow: "0 8px 24px rgba(15,74,52,.12)" } };

export function TrendChart({ data }: { data: { month: string; applications: number; approved: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DB67F" stopOpacity={0.45} /><stop offset="100%" stopColor="#3DB67F" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7EFEA" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#7B8680" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7B8680" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="applications" name="Applications" stroke="#155A3F" strokeWidth={2.5} fill="url(#g1)" />
        <Area type="monotone" dataKey="approved" name="Approved" stroke="#3DB67F" strokeWidth={2} fillOpacity={0} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, colors = CHART_COLORS }: { data: { name: string; value: number }[]; colors?: string[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip {...tip} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {data.map((d, i) => <li key={d.name} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} /><span className="truncate text-ink-soft">{d.name}</span><b className="ml-auto">{total ? Math.round((d.value / total) * 100) : 0}%</b></li>)}
      </ul>
    </div>
  );
}

export function RouteBar({ data }: { data: { route: string; students: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7EFEA" vertical={false} />
        <XAxis dataKey="route" tick={{ fontSize: 11, fill: "#7B8680" }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7B8680" }} axisLine={false} tickLine={false} />
        <Tooltip {...tip} cursor={{ fill: "#EEF6F2" }} />
        <Bar dataKey="students" name="Students" radius={[8, 8, 0, 0]} fill="#155A3F" />
      </BarChart>
    </ResponsiveContainer>
  );
}
