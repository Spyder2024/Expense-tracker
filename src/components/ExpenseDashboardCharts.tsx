"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";

interface PersonalExpense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface ExpenseDashboardChartsProps {
  expenses: PersonalExpense[];
}

const BUSINESS_MINIMALIST_COLORS_LIGHT = [
  "#18181B", // Soft Obsidian
  "#2E6F40", // Forest Olive
  "#706E6B", // Warm Gray
  "#9E2A2B", // Deep Crimson
  "#52525B", // Mid Zinc
  "#A1A1AA", // Light Ash
];

const BUSINESS_MINIMALIST_COLORS_DARK = [
  "#F4F4F5", // Crisp Ash
  "#4ADE80", // Light Olive
  "#A1A1AA", // Warm Muted
  "#F87171", // Coral Crimson
  "#71717A", // Zinc
  "#E4E4E7", // Soft Light
];

export function ExpenseDashboardCharts({ expenses }: ExpenseDashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const palette = isDark ? BUSINESS_MINIMALIST_COLORS_DARK : BUSINESS_MINIMALIST_COLORS_LIGHT;
  const strokeColor = isDark ? "#F4F4F5" : "#18181B";
  const tickColor = isDark ? "#A1A1AA" : "#706E6B";
  const gridColor = isDark ? "#2D2D2D" : "#EAE8E3";

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        <div className="h-64 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] animate-pulse" />
        <div className="h-64 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] animate-pulse" />
      </div>
    );
  }

  // Category Breakdown for Donut Chart
  const categoryTotals = expenses.reduce((acc, curr) => {
    const amt = Number(curr.amount) || 0;
    acc[curr.category] = (acc[curr.category] || 0) + amt;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
  }));

  // Daily Spending Trend
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const trendMap = sortedExpenses.reduce((acc, curr) => {
    const formattedDate = new Date(curr.date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    const amt = Number(curr.amount) || 0;
    acc[formattedDate] = (acc[formattedDate] || 0) + amt;
    return acc;
  }, {} as Record<string, number>);

  const lineData = Object.entries(trendMap).map(([date, amount]) => ({
    date,
    amount,
  }));

  const hasData = expenses.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* Donut Chart */}
      <div className="p-6 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#706E6B] dark:text-[#A1A1AA]" />
            <h3 className="text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
              Category Allocation
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#706E6B] dark:text-[#A1A1AA] uppercase tracking-wider">
            Share
          </span>
        </div>

        {!hasData ? (
          <div className="h-52 flex items-center justify-center text-xs font-medium text-[#706E6B] dark:text-[#A1A1AA]">
            No category data to display
          </div>
        ) : (
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={palette[index % palette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] shadow-md text-xs font-medium">
                          <p className="text-[#1A1A1A] dark:text-[#F4F4F5] font-semibold">
                            {data.name}
                          </p>
                          <p className="text-[#2E6F40] dark:text-[#4ADE80] tabular-nums font-bold mt-0.5">
                            ₹{Number(data.value).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {hasData && (
          <div className="mt-4 pt-3 border-t border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80 flex flex-wrap gap-2 justify-center">
            {pieData.slice(0, 4).map((entry, idx) => (
              <div
                key={entry.name}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[#706E6B] dark:text-[#A1A1AA]"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: palette[idx % palette.length],
                  }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Line Chart */}
      <div className="p-6 rounded-2xl border border-[#EAE8E3] dark:border-[#2D2D2D] bg-white dark:bg-[#1E1E1E] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#706E6B] dark:text-[#A1A1AA]" />
            <h3 className="text-lg font-semibold tracking-tight text-[#1A1A1A] dark:text-[#F4F4F5]">
              Spending Velocity
            </h3>
          </div>
          <span className="text-xs font-semibold text-[#706E6B] dark:text-[#A1A1AA] uppercase tracking-wider">
            Timeline
          </span>
        </div>

        {!hasData ? (
          <div className="h-52 flex items-center justify-center text-xs font-medium text-[#706E6B] dark:text-[#A1A1AA]">
            No spending trends to display
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={gridColor}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: tickColor }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: tickColor }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-[#EAE8E3] dark:border-[#2D2D2D] shadow-md text-xs font-medium">
                          <p className="text-[#706E6B] dark:text-[#A1A1AA]">
                            {data.payload.date}
                          </p>
                          <p className="text-[#9E2A2B] dark:text-[#F87171] tabular-nums font-bold mt-0.5">
                            ₹{Number(data.value).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={strokeColor}
                  strokeWidth={2.5}
                  dot={{ fill: strokeColor, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#EAE8E3]/80 dark:border-[#2D2D2D]/80 flex items-center justify-between text-xs font-medium text-[#706E6B] dark:text-[#A1A1AA]">
          <span>Smooth Monotone Trend</span>
          <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">
            Daily Spending
          </span>
        </div>
      </div>
    </div>
  );
}
