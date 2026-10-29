// วันที่ทั้งแอปเก็บเป็นข้อความ 'YYYY-MM-DD' (ตรงกับคอลัมน์ date ใน Supabase)
// และคิดตามเวลาในเครื่อง เพื่อไม่ให้วันเลื่อนเพราะ timezone

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const WEEKDAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n) {
  return String(n).padStart(2, '0');
}

export function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return false;
  return toISO(parseISO(iso)) === iso;
}

export function todayISO() {
  return toISO(new Date());
}

export function addDaysISO(iso, days) {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

// จำนวนวันจาก a ถึง b (b - a) เช่น วันนี้ถึงพรุ่งนี้ = 1
export function daysBetween(aISO, bISO) {
  return Math.round((parseISO(bISO) - parseISO(aISO)) / DAY_MS);
}

// "ส. 11 ต.ค. 2569"
export function formatThaiDate(iso, { weekday = false } = {}) {
  const date = parseISO(iso);
  const text = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
  return weekday ? `${WEEKDAYS[date.getDay()]} ${text}` : text;
}

// "11 ต.ค."
export function formatShortDate(iso) {
  const date = parseISO(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function weekdayShort(iso) {
  return WEEKDAYS_SHORT[parseISO(iso).getDay()];
}

export function dayOfMonth(iso) {
  return parseISO(iso).getDate();
}
