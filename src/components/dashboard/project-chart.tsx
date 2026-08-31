"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";

export function ProjectChart({
  data,
}: {
  data: Array<{ status: string; count: number }>;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 24, top: 4, bottom: 4 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={92}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              borderRadius: 8,
              borderColor: "var(--border)",
              background: "var(--surface-elevated)",
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill="var(--primary)"
            radius={[0, 4, 4, 0]}
            barSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
