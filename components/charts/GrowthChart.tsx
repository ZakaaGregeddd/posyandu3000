'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface GrowthData {
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  imt: number;
}

interface GrowthChartProps {
  data: GrowthData[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center border border-dashed border-outline-variant rounded-xl bg-white text-on-surface-variant p-4">
        <span className="material-symbols-outlined text-4xl mb-2 text-outline">analytics</span>
        <p className="text-sm font-medium">Belum ada data pemeriksaan</p>
        <p className="text-xs text-outline mt-1">Tambahkan data kunjungan untuk melihat grafik perkembangan.</p>
      </div>
    );
  }

  // Format date to local Indonesian month
  const formattedData = data.map((item) => {
    const date = new Date(item.tanggalPemeriksaan);
    const month = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    return {
      ...item,
      displayDate: month
    };
  });

  return (
    <div className="h-[350px] w-full bg-white p-4 rounded-xl border border-outline-variant/30">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fill: '#444748', fontSize: 11 }}
            axisLine={{ stroke: '#c4c7c8' }} 
          />
          <YAxis 
            yAxisId="left"
            tick={{ fill: '#444748', fontSize: 11 }}
            axisLine={{ stroke: '#c4c7c8' }}
            label={{ value: 'Tinggi (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#444748' } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fill: '#444748', fontSize: 11 }}
            axisLine={{ stroke: '#c4c7c8' }}
            label={{ value: 'Berat (kg)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: 10, fill: '#444748' } }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #c4c7c8' }}
            labelStyle={{ fontWeight: 'bold', fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="tinggiBadan"
            name="Tinggi Badan (cm)"
            stroke="#ab2c5d"
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="beratBadan"
            name="Berat Badan (kg)"
            stroke="#0284c7"
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
