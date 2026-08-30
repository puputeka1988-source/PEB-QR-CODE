import { TeachingScheduleItem, ClassKokurikulerP5, TeacherAdditionalDuty } from '../types';

/**
 * Calculates teaching hour units (JP / JTM) from jamKe string (e.g. "1 - 2" => 2 JP)
 */
export const parseJp = (jamKe: string, explicitJtm?: number): number => {
  if (explicitJtm && explicitJtm > 0) return explicitJtm;
  if (!jamKe) return 2;
  
  // Format "1 - 2", "3 - 5", "1-3"
  const rangeMatch = jamKe.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return (end - start) + 1;
    }
  }
  
  // Format single number "2", "3"
  const singleMatch = jamKe.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  
  return 2;
};

export interface WorkloadSummary {
  totalIntrakurikulerJp: number;
  totalP5Jp: number;
  totalTugasTambahanJp: number;
  totalBebanMengajar: number;
  distinctClasses: string[];
}

/**
 * Day name to 1-based index mapping (Senin = 1, Minggu = 7)
 */
export const DAY_NAME_TO_INDEX: { [day: string]: number } = {
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
  'minggu': 7
};

/**
 * Converts a time string (e.g. "07:15") to total minutes from midnight for accurate time-based sorting
 */
export const parseTimeToMinutes = (timeStr?: string): number => {
  if (!timeStr) return 9999;
  const parts = timeStr.trim().split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(mins)) {
      return hours * 60 + mins;
    }
  }
  return 9999;
};

/**
 * Resolves day index from a schedule item, falling back to day name mapping
 */
export const getScheduleDayIndex = (item: TeachingScheduleItem): number => {
  if (typeof item.dayIndex === 'number' && item.dayIndex >= 1 && item.dayIndex <= 7) {
    return item.dayIndex;
  }
  if (item.day) {
    const normalized = item.day.toLowerCase().trim();
    if (DAY_NAME_TO_INDEX[normalized]) {
      return DAY_NAME_TO_INDEX[normalized];
    }
  }
  return 99;
};

export interface ClassScheduleInfo {
  className: string;
  hasSchedule: boolean;
  primarySchedule?: TeachingScheduleItem;
  allSchedules: TeachingScheduleItem[];
  scheduleBadge: string;
  scheduleSummary: string;
  dayIndex: number;
  startTimeMinutes: number;
  isToday: boolean;
  todaySlot?: TeachingScheduleItem;
}

/**
 * Extracts teaching schedule details for a specific class
 */
export const getClassScheduleInfo = (
  className: string,
  schedules: TeachingScheduleItem[],
  currentDayName?: string
): ClassScheduleInfo => {
  if (!className) {
    return {
      className: '',
      hasSchedule: false,
      allSchedules: [],
      scheduleBadge: 'Tanpa Jadwal',
      scheduleSummary: 'Belum terdaftar di jadwal',
      dayIndex: 99,
      startTimeMinutes: 9999,
      isToday: false
    };
  }

  const matching = (schedules || []).filter(
    s => s.kelas && s.kelas.trim().toLowerCase() === className.trim().toLowerCase()
  );

  if (matching.length === 0) {
    return {
      className,
      hasSchedule: false,
      allSchedules: [],
      scheduleBadge: 'Non-Jadwal',
      scheduleSummary: 'Kelas tidak ada dalam jadwal mengajar mingguan',
      dayIndex: 99,
      startTimeMinutes: 9999,
      isToday: false
    };
  }

  // Sort matching slots by dayIndex, then startTime
  const sortedSlots = matching.slice().sort((a, b) => {
    const dayDiff = getScheduleDayIndex(a) - getScheduleDayIndex(b);
    if (dayDiff !== 0) return dayDiff;
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  const primary = sortedSlots[0];
  const primaryDayIndex = getScheduleDayIndex(primary);
  const primaryTimeMins = parseTimeToMinutes(primary.startTime);

  // Check if today matches any slot
  const normalizedToday = currentDayName ? currentDayName.toLowerCase().trim() : '';
  const todaySlot = normalizedToday
    ? sortedSlots.find(s => s.day && s.day.toLowerCase().trim() === normalizedToday)
    : undefined;

  // Build short readable badges (e.g. "Senin 07:15 (Jam 1-2)" or "Senin & Rabu")
  let scheduleBadge = '';
  if (sortedSlots.length === 1) {
    scheduleBadge = `${primary.day} ${primary.startTime} (Jam ${primary.jamKe || 'KBM'})`;
  } else {
    const days = Array.from(new Set(sortedSlots.map(s => s.day))).join(' & ');
    scheduleBadge = `${days} (${primary.startTime})`;
  }

  const scheduleSummary = sortedSlots
    .map(s => `${s.day} ${s.startTime}-${s.endTime} (Jam ${s.jamKe}) [${s.mapel || 'Mapel'}${s.ruang || s.room ? ` • ${s.ruang || s.room}` : ''}]`)
    .join(' | ');

  return {
    className,
    hasSchedule: true,
    primarySchedule: primary,
    allSchedules: sortedSlots,
    scheduleBadge,
    scheduleSummary,
    dayIndex: primaryDayIndex,
    startTimeMinutes: primaryTimeMins,
    isToday: Boolean(todaySlot),
    todaySlot
  };
};

/**
 * Sorts an array of class names in accordance with the teacher's teaching schedule:
 * 1. Classes with active teaching schedules come FIRST, ordered chronologically by Day (Senin -> Minggu) and Start Time (07:00 -> 16:00).
 * 2. If referenceDayName is provided (e.g. today is "Selasa"), classes scheduled for today can optionally be prioritized or sorted in weekly cycle.
 * 3. Classes without a teaching schedule appear AFTER scheduled classes, sorted alphanumerically (A-Z with natural number order).
 */
export const sortClassesByTeachingSchedule = (
  classes: string[],
  schedules: TeachingScheduleItem[],
  options?: {
    prioritizeToday?: boolean;
    todayDayName?: string;
  }
): string[] => {
  if (!classes || classes.length === 0) return [];
  if (!schedules || schedules.length === 0) {
    return classes.slice().sort((a, b) => (a || '').localeCompare(b || '', 'id', { numeric: true }));
  }

  const classInfoMap = new Map<string, ClassScheduleInfo>();
  classes.forEach(cls => {
    classInfoMap.set(cls, getClassScheduleInfo(cls, schedules, options?.todayDayName));
  });

  const normalizedToday = options?.todayDayName ? options.todayDayName.toLowerCase().trim() : '';

  return classes.slice().sort((a, b) => {
    const infoA = classInfoMap.get(a)!;
    const infoB = classInfoMap.get(b)!;

    // Both without schedule => sort alphanumerically
    if (!infoA.hasSchedule && !infoB.hasSchedule) {
      return (a || '').localeCompare(b || '', 'id', { numeric: true });
    }
    // Only A has schedule => A comes first
    if (infoA.hasSchedule && !infoB.hasSchedule) return -1;
    // Only B has schedule => B comes first
    if (!infoA.hasSchedule && infoB.hasSchedule) return 1;

    // If prioritizeToday is requested and today has scheduled classes
    if (options?.prioritizeToday && normalizedToday) {
      if (infoA.isToday && !infoB.isToday) return -1;
      if (!infoA.isToday && infoB.isToday) return 1;
      if (infoA.isToday && infoB.isToday && infoA.todaySlot && infoB.todaySlot) {
        const timeDiff = parseTimeToMinutes(infoA.todaySlot.startTime) - parseTimeToMinutes(infoB.todaySlot.startTime);
        if (timeDiff !== 0) return timeDiff;
      }
    }

    // Sort by Day of Week (Senin -> Minggu)
    if (infoA.dayIndex !== infoB.dayIndex) {
      return infoA.dayIndex - infoB.dayIndex;
    }

    // Sort by Start Time (e.g. 07:15 before 08:35)
    if (infoA.startTimeMinutes !== infoB.startTimeMinutes) {
      return infoA.startTimeMinutes - infoB.startTimeMinutes;
    }

    // Fallback: natural alphanumeric
    return (a || '').localeCompare(b || '', 'id', { numeric: true });
  });
};

/**
 * Calculates complete synchronized teaching workload across Intra, P5, and Additional Duties
 */
export const calculateTeachingWorkload = (
  schedules: TeachingScheduleItem[],
  p5ConfigMap: { [kelas: string]: ClassKokurikulerP5 } = {},
  additionalDuties: TeacherAdditionalDuty[] = []
): WorkloadSummary => {
  const setCls = new Set<string>();
  schedules.forEach(item => {
    if (item.kelas) setCls.add(item.kelas.trim());
  });
  const distinctClasses = Array.from(setCls).sort();

  const totalIntrakurikulerJp = schedules.reduce((acc, curr) => acc + parseJp(curr.jamKe, curr.jtm), 0);

  const totalP5Jp = distinctClasses.reduce((acc, cls) => {
    const p5 = p5ConfigMap[cls];
    if (p5 && p5.isEnabled !== false) {
      return acc + (p5.jp || 0);
    }
    return acc;
  }, 0);

  const totalTugasTambahanJp = additionalDuties
    .filter(d => d.isActive)
    .reduce((acc, d) => acc + d.jtmEquivalent, 0);

  const totalBebanMengajar = totalIntrakurikulerJp + totalP5Jp + totalTugasTambahanJp;

  return {
    totalIntrakurikulerJp,
    totalP5Jp,
    totalTugasTambahanJp,
    totalBebanMengajar,
    distinctClasses
  };
};
