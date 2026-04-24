import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseAndFormatDate(dateStr: string): string {
  if (!dateStr || dateStr === "N/D") return "N/D";
  
  // Clean the string
  let clean = dateStr.trim().toLowerCase();
  
  // If already in DD/MM/YYYY format, just return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
  
  // Handle DD.MM.YYYY or DD-MM-YYYY
  if (/^\d{2}[\.\-]\d{2}[\.\-]\d{4}$/.test(clean)) {
    return clean.replace(/[\.\-]/g, "/");
  }

  // Handle formats like "10 apr 2026" or "10 aprile 2026"
  const months: Record<string, string> = {
    'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'mag': '05', 'giu': '06',
    'lug': '07', 'ago': '08', 'set': '09', 'ott': '10', 'nov': '11', 'dic': '12',
    'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04', 'maggio': '05', 'giugno': '06',
    'luglio': '07', 'agosto': '08', 'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
  };

  const parts = clean.split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0');
    const monthName = parts[1];
    const year = parts[2];
    
    const month = months[monthName] || months[monthName.substring(0, 3)];
    if (month && /^\d{4}$/.test(year)) {
      return `${day}/${month}/${year}`;
    }
  }

  return dateStr; // Fallback to original if parsing fails
}

export const getDayOfWeek = (dateStr: string): string => {
  if (!dateStr) return 'N/D';
  try {
    let year: number, month: number, day: number;
    const datePart = dateStr.split(/[ T]/)[0]; // get the first part
    
    if (datePart.includes('/')) {
      // typical DD/MM/YYYY
      const parts = datePart.split('/');
      if (parts.length !== 3) return 'N/D';
      day = Number(parts[0]);
      month = Number(parts[1]) - 1;
      year = Number(parts[2]);
    } else if (datePart.includes('-')) {
      const parts = datePart.split('-');
      if (parts.length !== 3) return 'N/D';
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = Number(parts[0]);
        month = Number(parts[1]) - 1;
        day = Number(parts[2]);
      } else {
        // DD-MM-YYYY
        day = Number(parts[0]);
        month = Number(parts[1]) - 1;
        year = Number(parts[2]);
      }
    } else {
      return 'N/D';
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return 'N/D';
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[date.getDay()];
  } catch (e) {
    return 'N/D';
  }
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Data N/D';
  // If already matches DD/MM/YYYY HH:MM skip
  if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dateStr)) return dateStr;
  
  try {
    let d: Date;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
       const parts = dateStr.split(' ');
       const dParts = parts[0].split('/');
       const tParts = (parts[1] || '00:00').split(':');
       d = new Date(Number(dParts[2]), Number(dParts[1])-1, Number(dParts[0]), Number(tParts[0]), Number(tParts[1]));
    } else {
       d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch(e) {
    return dateStr;
  }
};

export const getTimeSlot = (dateStr: string): string => {
  if (!dateStr) return 'N/D';
  try {
    let timeStr = "";
    if (dateStr.includes('T')) {
      timeStr = dateStr.split('T')[1].split('.')[0];
    } else if (dateStr.includes(' ')) {
      timeStr = dateStr.split(' ')[1];
    } else {
      return 'N/D';
    }
    const hour = parseInt(timeStr.split(':')[0]);
    if (isNaN(hour)) return 'N/D';
    if (hour >= 0 && hour < 6) return '00:00 - 06:00';
    if (hour >= 6 && hour < 12) return '06:00 - 12:00';
    if (hour >= 12 && hour < 18) return '12:00 - 18:00';
    if (hour >= 18 && hour <= 23) return '18:00 - 24:00';
    return 'N/D';
  } catch (e) {
    return 'N/D';
  }
};

export const getAge = (dob?: string) => {
  if (!dob) return -1;
  let birthDate: Date;
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dob)) {
    const [d, m, y] = dob.split('/').map(Number);
    birthDate = new Date(y, m - 1, d);
  } else {
    birthDate = new Date(dob);
  }
  
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
};
