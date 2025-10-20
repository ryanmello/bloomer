// components/dashboard/MetricCard.tsx
import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  changePct?: number;             // e.g., 12.5 means +12.5%
  caption?: string;               // e.g., "from last month"
};

export default function MetricCard({ title, value, icon, changePct, caption = "from last month" }: Props) {
  const up = typeof changePct === "number" ? changePct >= 0 : undefined;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm h-36 min-w-[260px]">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="rounded-xl bg-gray-50 p-2">{icon}</div>
      </div>

      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>

      {typeof changePct === "number" && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              up
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
            }`}
          >
            {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {up ? "+" : ""}
            {changePct.toFixed(1)}%
          </span>
          <span className="text-gray-500">{caption}</span>
        </div>
      )}
    </div>
  );
}
