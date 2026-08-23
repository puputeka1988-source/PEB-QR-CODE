import { Student, AppSettings } from '../types';

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
 * Generates 2-character initials from a student's name
 * e.g., "Ahmad Dahlan" -> "AD", "Farhan" -> "FA", "Siti Nurhaliza" -> "SN"
 */
export function getStudentInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '--';
  const clean = name.trim();
  if (!clean) return '--';

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0].charAt(0);
    const second = words[1].charAt(0);
    return `${first}${second}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
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

/**
 * Generates standardized HTML for official Indonesian school document header (KOP SURAT)
 * Left: Logo Instansi / Pemerintah Daerah / Kementerian / Tut Wuri Handayani
 * Right: Logo Resmi Sekolah / Satuan Pendidikan
 */
export function generateOfficialKopHtml(
  settings: Partial<AppSettings>,
  options?: {
    showDoubleLine?: boolean;
    marginBottom?: string;
    textColor?: string;
  }
): string {
  const showDoubleLine = options?.showDoubleLine ?? true;
  const marginBottom = options?.marginBottom || '14px';
  const textColor = options?.textColor || '#000000';

  const prov = settings.instansiProvinsi?.trim();
  const kab = settings.instansiKabupaten?.trim();
  const school = settings.sekolah?.trim() || 'NAMA SEKOLAH / SATUAN PENDIDIKAN';
  const alamat = settings.alamat?.trim() || '';

  const logoKiri = settings.logoKiriUrl?.trim() || '';
  const logoKanan = settings.logoKananUrl?.trim() || settings.logoUrl?.trim() || '';

  let fullAlamat = alamat;
  if (settings.kontakSekolah && !fullAlamat.includes(settings.kontakSekolah)) {
    fullAlamat += fullAlamat ? ` • Telp: ${settings.kontakSekolah}` : `Telp: ${settings.kontakSekolah}`;
  }

  return `
    <div class="official-kop-surat" style="position: relative; text-align: center; color: ${textColor}; padding-bottom: 8px; margin-bottom: ${marginBottom}; border-bottom: ${showDoubleLine ? '3px double ' + textColor : 'none'};">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 56px;">
        <div style="flex-shrink: 0; width: 56px; height: 56px; min-width: 56px; max-width: 56px; display: flex; align-items: center; justify-content: center;">
          ${logoKiri ? `<img src="${logoKiri}" width="54" height="54" style="width: 54px; height: 54px; max-height: 54px; max-width: 54px; object-fit: contain; display: block;" alt="Logo Kop Kiri" class="kop-img" />` : '<div style="width: 56px; height: 56px;"></div>'}
        </div>
        <div style="flex: 1; padding: 0 6px; text-align: center; font-family: 'Times New Roman', Times, serif;">
          ${prov ? `<div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.25; margin-bottom: 1px; color: ${textColor};">${prov}</div>` : ''}
          ${kab ? `<div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.25; margin-bottom: 1px; color: ${textColor};">${kab}</div>` : ''}
          <div style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; line-height: 1.2; margin-top: 1px; color: ${textColor};">${school}</div>
          ${fullAlamat ? `<div style="font-size: 9px; color: #334155; margin-top: 2px; line-height: 1.3; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${fullAlamat}</div>` : ''}
        </div>
        <div style="flex-shrink: 0; width: 56px; height: 56px; min-width: 56px; max-width: 56px; display: flex; align-items: center; justify-content: center;">
          ${logoKanan ? `<img src="${logoKanan}" width="54" height="54" style="width: 54px; height: 54px; max-height: 54px; max-width: 54px; object-fit: contain; display: block;" alt="Logo Kop Kanan" class="kop-img" />` : '<div style="width: 56px; height: 56px;"></div>'}
        </div>
      </div>
    </div>
  `;
}

