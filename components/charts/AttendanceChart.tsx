"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAttendanceStats, AttendanceDataPoint } from "@/lib/fetch/statistik";

export function AttendanceChart() {
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    currentYear,
    currentYear - 1,
    currentYear - 2,
    currentYear - 3,
  ].map(String);

  const [year, setYear] = useState<string>(String(currentYear));
  const [chartData, setChartData] = useState<AttendanceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");

    getAttendanceStats(year)
      .then((data) => {
        if (active) setChartData(data);
      })
      .catch((err: any) => {
        if (active) setError(err.message || "Gagal memuat statistik kehadiran");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [year]);

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
              onChange={(e) => setYear(e.target.value)}
              className="bg-surface-container border border-outline-variant text-sm rounded-md px-2 py-1 text-on-surface"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Jumlah partisipan atau data pemeriksaan yang masuk tiap bulan.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
            Memuat data...
          </div>
        ) : (
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
                allowDecimals={false}
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
                dot={{
                  fill: "#ffffff",
                  stroke: "#ef4444",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "#ef4444",
                  stroke: "#ffffff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
