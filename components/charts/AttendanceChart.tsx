"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { attendanceData } from "@/lib/data/mock-db";

export function AttendanceChart() {
  const [year, setYear] = useState<"2024" | "2025">("2025");

  const chartData = attendanceData[year] || [];

  return (
    <Card className="p-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-lg font-bold text-on-background">
              Statistik Kehadiran Bulanan
            </h3>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value as "2024" | "2025")}
              className="bg-surface-container border border-outline-variant text-sm rounded-md px-2 py-1 text-on-surface"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Jumlah partisipan atau data pemeriksaan yang masuk tiap bulan.
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorKehadiran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "#0f172a", fontWeight: "bold" }}
              labelStyle={{ color: "#64748b", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="kehadiran"
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorKehadiran)"
              dot={{ fill: '#ffffff', stroke: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#ef4444", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
