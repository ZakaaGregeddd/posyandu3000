export interface Age {
  years: number;
  months: number;
  totalMonths: number;
  text: string;
}

export function calculateAge(birthDateStr: string): Age {
  if (!birthDateStr) {
    return { years: 0, months: 0, totalMonths: 0, text: '0 bulan' };
  }
  
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      months = 11;
      years--;
    }
  }

  const totalMonths = (years * 12) + months;
  
  let text = '';
  if (years > 0) {
    text += `${years} tahun`;
    if (months > 0) {
      text += ` ${months} bulan`;
    }
  } else {
    text += `${months} bulan`;
  }
  
  return {
    years,
    months,
    totalMonths,
    text: text.trim() || '0 bulan'
  };
}

export function classifyCategory(birthDateStr: string, type: 'balita' | 'lansia'): string {
  const age = calculateAge(birthDateStr);
  
  if (type === 'balita') {
    if (age.totalMonths <= 12) {
      return 'Bayi (0-12 bulan)';
    } else {
      return 'Balita (1-5 tahun)';
    }
  } else {
    const years = age.years;
    if (years >= 45 && years < 50) {
      return 'Pralansia (45-50 tahun)';
    } else if (years >= 50 && years < 60) {
      return 'Lansia (50-60 tahun)';
    } else if (years >= 60) {
      return 'Lanjut Usia Resiko Tinggi (60+ tahun)';
    }
    return 'Lainnya';
  }
}

export function calculateIMT(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  const imt = weightKg / (heightM * heightM);
  return Math.round(imt * 100) / 100;
}

export function isRecordEntryLocked(birthDateStr: string, category: 'balita' | 'lansia' | 'ibu-hamil'): boolean {
  if (category !== 'balita') return false;
  const age = calculateAge(birthDateStr);
  return age.years >= 5;
}

export function calculateGestationWeeks(hphtDateStr: string): string {
  if (!hphtDateStr) return '0 minggu';
  const hpht = new Date(hphtDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - hpht.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  return `${weeks} minggu ${days} hari`;
}
