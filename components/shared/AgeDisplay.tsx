'use client';

import React from 'react';
import { calculateAge } from '@/lib/utils/health';

interface AgeDisplayProps {
  birthDate: string;
}

export default function AgeDisplay({ birthDate }: AgeDisplayProps) {
  const age = calculateAge(birthDate);
  return (
    <span className="text-sm font-medium text-on-surface" title={`Lahir: ${new Date(birthDate).toLocaleDateString('id-ID')}`}>
      {age.text}
    </span>
  );
}
