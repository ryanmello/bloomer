"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {TrendingUp, TrendingDown} from "lucide-react";

// ---------- Types ----------
export type TrendPoint = {
  month: string; // e.g., "Jan"
  revenue: number; // dollars
  orders: number; // count
};

type TrendGraphProps = {
  title?: React.ReactNode | string;
  value?: React.ReactNode | number; // headline value (e.g., total revenue)
  icon?: React.ReactNode; // optional leading icon
  changePct?: number; // positive or negative
  caption?: string; // small text under change (e.g., "from last month")
  data?: TrendPoint[]; // time series for chart
};

// ---------- Helpers ----------
const defaultData: TrendPoint[] = [
  {month: "Jan", revenue: 4000, orders: 8},
  {month: "Feb", revenue: 3000, orders: 8},
  {month: "Mar", revenue: 5000, orders: 9},
  {month: "Apr", revenue: 4500, orders: 8},
  {month: "May", revenue: 6000, orders: 9},
  {month: "Jun", revenue: 5800, orders: 9},
  {month: "Jul", revenue: 7200, orders: 9},
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------- Component ----------
export default function TrendGraph({
  title = "Revenue & Orders Trend (Square Data)",
  value,
  icon,
  changePct,
  caption = "from last month",
  data = defaultData,
}: TrendGraphProps) {
  const up = typeof changePct === "number" ? changePct >= 0 : undefined;
  const headline = typeof value === "number" ? formatCurrency(value) : value;

  return (
    <div className="rounded-2xl border shadow-sm p-4 md:p-6 bg-white border-gray-200 dark:bg-neutral-900 dark:border-neutral-800">
      {/* Optional global dashboard header (keep if you need it) */}
      {/* <DashboardHeaderClient /> */}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="shrink-0 text-neutral-700 dark:text-neutral-300">
              {icon}
            </div>
          )}
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            {typeof title === "string" ? (
              <span className="text-neutral-800 dark:text-neutral-100 font-semibold">
                {title}
              </span>
            ) : (
              title
            )}
          </div>
        </div>

        {/* Headline metric + change */}
        <div className="text-right">
          {headline && (
            <div className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              {headline}
            </div>
          )}
          {typeof changePct === "number" && (
            <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium">
              {up ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{changePct.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-rose-600 dark:text-rose-400">
                    {changePct.toFixed(1)}%
                  </span>
                </>
              )}
              {caption && (
                <span className="text-neutral-500 dark:text-neutral-400 ml-1">
                  {caption}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{top: 12, right: 8, left: 8, bottom: 0}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{fontSize: 12}} tickMargin={8} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => `$${v / 1000}k`}
              width={48}
              tick={{fontSize: 12}}
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip
              formatter={(value: any, name?: string | number) => {
                if (name === "revenue")
                  return [formatCurrency(value as number), "Revenue"];
                if (name === "orders") return [value as number, "Orders"];
                return [value, name];
              }}
              labelFormatter={(label: any) => `Month: ${label}`}
            />
            {/* Revenue (red) */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{r: 3}}
              activeDot={{r: 5}}
            />
            {/* Orders (blue, near-zero baseline in screenshot) */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{r: 2}}
              activeDot={{r: 4}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
