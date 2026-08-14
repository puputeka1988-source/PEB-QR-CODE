import { Student } from '../types';

/**
 * Utility functions for clean date and time formatting
 */

/**
 * Ensures a date string is formatted strictly as YYYY-MM-DD
 */
export function cleanDateFormat(rawDate: string | undefined | null): string {
  if (!rawDate) {
    return new Date().toISOString().split('T')[0];
  }
  let str = String(rawDate).replace(/^'/, '').trim();
  if (str.includes('T')) {
    str = str.split('T')[0];
  }
  if (str.includes(' ')) {
    str = str.split(' ')[0];
  }
  // Validate YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // If it's DD/MM/YYYY or D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  // Try Date parsing fallback
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return str || new Date().toISOString().split('T')[0];
}

/**
 * Ensures a time string is formatted strictly as HH:mm:ss
 */
export function cleanTimeFormat(rawTime: string | undefined | null): string {
  if (!rawTime) {
    return '00:00:00';
  }
  let str = String(rawTime).replace(/^'/, '').trim();

  // Search for any valid HH:mm:ss or HH:mm time pattern in the string
  const timeMatch = str.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\b/);
  if (timeMatch) {
    const hh = timeMatch[1].padStart(2, '0');
    const mm = timeMatch[2];
    const ss = timeMatch[3] ? timeMatch[3] : '00';
    return `${hh}:${mm}:${ss}`;
  }

  // Fallback try Date object parsing
  const d = new Date(rawTime);
  if (!isNaN(d.getTime())) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    if (hh !== '00' || mm !== '00' || ss !== '00') {
      return `${hh}:${mm}:${ss}`;
    }
  }

  return '00:00:00';
}

/**
 * Formats a YYYY-MM-DD date string into Indonesian day and date
 */
export function formatIndonesianDayAndDate(dateStr: string): { day: string; formattedDate: string; fullString: string } {
  try {
    const cleanStr = cleanDateFormat(dateStr);
    const d = new Date(cleanStr + 'T00:00:00');
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const day = days[d.getDay()] || 'Senin';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;
    const fullString = `${day}, ${dd} ${months[d.getMonth()]} ${yyyy}`;
    return { day, formattedDate, fullString };
  } catch (e) {
    return { day: 'Senin', formattedDate: dateStr, fullString: dateStr };
  }
}

/**
 * Sorts students or student items primarily by Class (alphanumeric e.g. 10A, 10B, XA, XB), then by Name (alphabetical)
 */
export function sortStudents(students: Student[]): Student[];
export function sortStudents(students: Omit<Student, 'id'>[]): Omit<Student, 'id'>[];
export function sortStudents<T extends { class?: string; name?: string }>(students: T[]): T[];
export function sortStudents(students: any[]): any[] {
  return [...students].sort((a, b) => {
    const classA = String(a?.class || '').trim();
    const classB = String(b?.class || '').trim();
    const classCompare = classA.localeCompare(classB, 'id', { numeric: true, sensitivity: 'base' });
    if (classCompare !== 0) return classCompare;

    const nameA = String(a?.name || '').trim();
    const nameB = String(b?.name || '').trim();
    return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
  });
}
