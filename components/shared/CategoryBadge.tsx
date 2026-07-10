'use client';

import React from 'react';
import { classifyCategory } from '@/lib/utils/health';

interface CategoryBadgeProps {
  birthDate: string;
  type: 'balita' | 'lansia';
}

export default function CategoryBadge({ birthDate, type }: CategoryBadgeProps) {
  const category = classifyCategory(birthDate, type);
  
  let bgStyles = "bg-primary-fixed text-on-primary-fixed-variant";
  if (category.includes('Bayi')) {
    bgStyles = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (category.includes('Balita')) {
    bgStyles = "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else if (category.includes('Pralansia')) {
    bgStyles = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (category.includes('Lansia') && !category.includes('Resiko')) {
    bgStyles = "bg-orange-50 text-orange-700 border-orange-200";
  } else if (category.includes('Resiko')) {
    bgStyles = "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bgStyles}`}>
      {category}
    </span>
  );
}
