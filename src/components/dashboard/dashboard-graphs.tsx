"use client";

import type { DashboardChartConfig } from "@/lib/services/dashboard-charts";
import { chartColor } from "@/components/dashboard/charts/chart-colors";

function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </article>
  );
}

function EmptyChart() {
  return (
    <p className="py-12 text-center text-sm text-slate-400">No data yet</p>
  );
}

function hasData(values: number[]) {
  return values.some((v) => v > 0);
}

function BarChartView({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.name}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-slate-700">{d.name}</span>
            <span className="text-slate-500">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: chartColor(i),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PieChartView({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const start = offset;
    offset += pct;
    return { ...d, pct, start, color: chartColor(i) };
  });

  const gradient = segments
    .map(
      (s) =>
        `${s.color} ${(s.start * 100).toFixed(2)}% ${((s.start + s.pct) * 100).toFixed(2)}%`
    )
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Pie chart"
      />
      <ul className="flex-1 space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-slate-700">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
            <span className="text-slate-500">
              {Math.round(s.pct * 100)}% ({s.value.toLocaleString()})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupedBarChartView({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
}) {
  const max = Math.max(
    ...data.flatMap((row) => series.map((s) => Number(row[s.key] ?? 0))),
    1
  );

  return (
    <ul className="space-y-4">
      {data.map((row) => (
        <li key={String(row.name)}>
          <p className="mb-2 text-xs font-medium text-slate-700">{row.name}</p>
          <div className="space-y-2">
            {series.map((s) => {
              const val = Number(row[s.key] ?? 0);
              return (
                <div key={s.key}>
                  <div className="mb-0.5 flex justify-between text-[11px] text-slate-500">
                    <span>{s.label}</span>
                    <span>{val.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(val / max) * 100}%`,
                        backgroundColor: s.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

function LineChartView({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const w = 320;
  const h = 140;
  const pad = 12;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full text-indigo-600"
        role="img"
        aria-label="Line chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = h - pad - t * (h - pad * 2);
          return (
            <line
              key={t}
              x1={pad}
              x2={w - pad}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          );
        })}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {points.map((p) => (
          <circle key={p.name} cx={p.x} cy={p.y} r={4} fill="currentColor" />
        ))}
      </svg>
      <ul className="mt-2 flex justify-between gap-1 text-[10px] text-slate-500">
        {data.map((d) => (
          <li key={d.name} className="truncate text-center" title={`${d.name}: ${d.value}`}>
            {d.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardGraphs({ charts }: { charts: DashboardChartConfig[] }) {
  if (charts.length === 0) return null;

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      {charts.map((chart, index) => {
        const key = `${chart.type}-${chart.title}-${index}`;

        if (chart.type === "bar") {
          const values = chart.data.map((d) => d.value);
          return (
            <ChartShell
              key={key}
              title={chart.title}
              description={chart.description}
            >
              {!hasData(values) ? <EmptyChart /> : <BarChartView data={chart.data} />}
            </ChartShell>
          );
        }

        if (chart.type === "pie") {
          const values = chart.data.map((d) => d.value);
          return (
            <ChartShell
              key={key}
              title={chart.title}
              description={chart.description}
            >
              {!hasData(values) ? <EmptyChart /> : <PieChartView data={chart.data} />}
            </ChartShell>
          );
        }

        if (chart.type === "grouped-bar") {
          const values = chart.data.flatMap((row) =>
            chart.series.map((s) => Number(row[s.key] ?? 0))
          );
          return (
            <ChartShell
              key={key}
              title={chart.title}
              description={chart.description}
            >
              {!hasData(values) ? (
                <EmptyChart />
              ) : (
                <GroupedBarChartView data={chart.data} series={chart.series} />
              )}
            </ChartShell>
          );
        }

        if (chart.type === "line") {
          const values = chart.data.map((d) => d.value);
          return (
            <ChartShell
              key={key}
              title={chart.title}
              description={chart.description}
            >
              {!hasData(values) ? <EmptyChart /> : <LineChartView data={chart.data} />}
            </ChartShell>
          );
        }

        return null;
      })}
    </section>
  );
}
