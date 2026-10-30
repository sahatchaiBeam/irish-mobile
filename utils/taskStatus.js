import { todayISO, daysBetween, formatShortDate } from './dates';
import { isTaskComplete } from './docStatus';

// งาน "เสร็จ" = เอกสารที่ต้องมีผ่านครบทุกชิ้น (คำนวณ ไม่เก็บในฐานข้อมูล)
// งานจากเว็บอาจยังไม่กำหนดวันส่ง → ถือว่าอีกนาน (ไม่ขึ้นเตือน)
export function daysLeft(task, today = todayISO()) {
  return task.dueDate ? daysBetween(today, task.dueDate) : Infinity;
}

export function isOverdue(task, today = todayISO()) {
  return !isTaskComplete(task) && daysLeft(task, today) < 0;
}

// บรรทัดกำหนดส่งบนการ์ด: { tone: 'error' | 'warning' | 'muted' | 'success', text }
export function deadlineLine(task, today = todayISO()) {
  if (!task.dueDate) return isTaskComplete(task) ? { tone: 'success', text: 'เอกสารผ่านครบ' } : { tone: 'muted', text: 'ยังไม่กำหนดวันส่ง' };
  const due = formatShortDate(task.dueDate);
  if (isTaskComplete(task)) return { tone: 'success', text: `เอกสารผ่านครบ · กำหนด ${due}` };
  const left = daysLeft(task, today);
  if (left < 0) return { tone: 'error', text: `เลยกำหนด ${-left} วัน · ${due}` };
  if (left === 0) return { tone: 'error', text: `ครบกำหนดวันนี้ · ${due}` };
  if (left <= 3) return { tone: 'warning', text: `ครบ ${due} (อีก ${left} วัน)` };
  return { tone: 'muted', text: `ครบ ${due} (อีก ${left} วัน)` };
}

// เรียงงาน: ยังไม่ผ่านครบก่อน แล้วตามกำหนดส่งที่ใกล้ที่สุด
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const doneA = isTaskComplete(a) ? 1 : 0;
    const doneB = isTaskComplete(b) ? 1 : 0;
    if (doneA !== doneB) return doneA - doneB;
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
  });
}

// ชื่อย่อ 2 ตัวอักษรสำหรับ avatar เช่น "นักศึกษา ป.โท" → "นป"
// ข้ามสระหน้า (เ แ โ ใ ไ) เพื่อให้ได้พยัญชนะต้น
function firstLetter(word) {
  const clean = word.replace(/^[เแโใไ]+/, '');
  return (clean || word)[0];
}

export function initials(name) {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) return firstLetter(parts[0]) + firstLetter(parts[1]);
  return parts[0].slice(0, 2);
}
