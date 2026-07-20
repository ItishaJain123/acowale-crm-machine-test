import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_LABELS, type Category } from "../lib/api";

export const CATEGORY_COLORS: Record<Category, string> = {
  PRODUCT: "#0d9488",
  BUG: "#ef4444",
  FEATURE_REQUEST: "#8b5cf6",
  UI_UX: "#f59e0b",
  SUPPORT: "#06b6d4",
  BILLING: "#ec4899",
  OTHER: "#78716c",
};

interface Props {
  data: { category: Category; count: number }[];
  total: number;
}

export default function CategoryChart({ data, total }: Props) {
  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category],
    value: d.count,
    color: CATEGORY_COLORS[d.category],
    pct: total ? Math.round((d.count / total) * 100) : 0,
  }));

  if (!total) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-stone-400">
        No feedback yet — the chart will appear once submissions come in.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Donut — full-width container so Recharts always measures a real size */}
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={3}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value ?? 0), String(name ?? "")]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-stone-900">{total}</span>
          <span className="text-xs text-stone-400">total</span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {chartData.map((entry) => (
          <li key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 truncate text-stone-600">{entry.name}</span>
            <span className="font-bold text-stone-900">{entry.pct}%</span>
            <span className="w-8 text-right text-stone-400">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
