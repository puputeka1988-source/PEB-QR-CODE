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

  // If ISO string like 2026-08-10T12:10:34.000Z
  if (str.includes('T')) {
    const afterT = str.split('T')[1];
    str = afterT.split('.')[0].split('Z')[0];
  }

  // If contains space e.g. "12:10:34 GMT+0700" or "2026-08-10 12:10:34"
  if (str.includes(' ')) {
    const parts = str.split(' ');
    // find the part matching HH:mm:ss or HH:mm or HH.mm.ss
    const timePart = parts.find(p => /^\d{1,2}[:.]\d{2}([:.]\d{2})?$/.test(p));
    if (timePart) {
      str = timePart;
    } else {
      str = parts[0];
    }
  }

  // Replace dots with colons (e.g., 12.10.34 -> 12:10:34)
  if (str.includes('.') && !str.includes(':')) {
    str = str.replace(/\./g, ':');
  }

  // Extract HH:mm:ss or HH:mm pattern
  const match = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2];
    const ss = match[3] ? match[3] : '00';
    return `${hh}:${mm}:${ss}`;
  }

  return str || '00:00:00';
}
