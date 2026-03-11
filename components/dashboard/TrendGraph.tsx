"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTheme } from 'next-themes';
import { TrendingUp, TrendingDown, Link as LinkIcon } from 'lucide-react';
import type { MonthlyRevenue } from '@/lib/square';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type Props = {
  monthlyRevenue?: MonthlyRevenue[] | null;
};

export default function TrendGraph({ monthlyRevenue }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const hasData = monthlyRevenue && monthlyRevenue.length > 0;

  const labels = hasData
    ? monthlyRevenue.map((m) => `${m.month} ${m.year}`)
    : [];
  const revenueData = hasData
    ? monthlyRevenue.map((m) => m.revenue)
    : [];

  const firstValue = revenueData[0] ?? 0;
  const lastValue = revenueData[revenueData.length - 1] ?? 0;
  const percentChange =
    firstValue > 0
      ? ((lastValue - firstValue) / firstValue * 100).toFixed(1)
      : '0.0';
  const isUp = Number(percentChange) >= 0;

  const data = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: revenueData,
        borderColor: isDark ? 'rgb(147, 197, 253)' : 'rgb(59, 130, 246)',
        backgroundColor: isDark ? 'rgba(147, 197, 253, 0.1)' : 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? 'rgb(147, 197, 253)' : 'rgb(59, 130, 246)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? 'rgb(23, 23, 23)' : 'rgb(255, 255, 255)',
        titleColor: isDark ? 'rgb(255, 255, 255)' : 'rgb(23, 23, 23)',
        bodyColor: isDark ? 'rgb(212, 212, 212)' : 'rgb(64, 64, 64)',
        borderColor: isDark ? 'rgb(64, 64, 64)' : 'rgb(229, 229, 229)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDark ? 'rgb(163, 163, 163)' : 'rgb(115, 115, 115)',
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          display: false,
        },
        ticks: {
          color: isDark ? 'rgb(163, 163, 163)' : 'rgb(115, 115, 115)',
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(1) + 'k';
          }
        },
      },
    },
  };

  if (!hasData) {
    return (
      <div className='w-full xl:w-2/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0'>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Monthly revenue over the past year</p>
        </div>
        <div className="h-72 flex flex-col items-center justify-center text-center">
          <LinkIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No revenue data available</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect your Square account to see revenue trends
          </p>
        </div>
      </div>
    );
  }

  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div className='w-full xl:w-2/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0'>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Monthly revenue over the past year</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ring-1 ${
          isUp
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700'
            : 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700'
        }`}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{isUp ? '+' : ''}{percentChange}%</span>
        </div>
      </div>
      <div className="h-72 min-w-0">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
