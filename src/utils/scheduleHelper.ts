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
