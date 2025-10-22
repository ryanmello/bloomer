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
import { TrendingUp } from 'lucide-react';

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

export default function TrendGraph() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Mock data showing upward trend
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [3200, 3800, 3500, 4200, 4600, 5100, 5400, 5800, 6200, 6800, 7100, 7500];
  
  // Calculate percentage change
  const firstValue = revenueData[0];
  const lastValue = revenueData[revenueData.length - 1];
  const percentChange = ((lastValue - firstValue) / firstValue * 100).toFixed(1);

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

  return (
    <div className='w-full lg:w-2/3 rounded-2xl border shadow-sm p-6 bg-card border-border'>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Monthly revenue over the past year</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{percentChange}%</span>
        </div>
      </div>
      <div className="h-72">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
