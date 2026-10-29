import { todayISO, toISO, daysBetween } from './dates';
import { daysInStatus, docStatusLabel, isTaskComplete, progressOf } from './docStatus';
import { daysLeft } from './taskStatus';

const WAIT_ALERT_DAYS = 3; // เอกสารรอเซ็นนานเท่านี้ขึ้นไปจึงเตือน
const DUE_ALERT_DAYS = 7; // เตือนกำหนดส่งล่วงหน้า
const EVENT_DAYS = 3; // แสดงการอัปเดตของคนอื่นย้อนหลัง

// "วันนี้ 14:05" · "เมื่อวาน" · "3 วันที่แล้ว"
export function whenText(timestamp, today = todayISO()) {
  const date = new Date(timestamp);
  const days = daysBetween(toISO(date), today);
  if (days <= 0) return `วันนี้ ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (days === 1) return 'เมื่อวาน';
  return `${days} วันที่แล้ว`;
}

// รายการแจ้งเตือนของผู้ใช้ จากงานที่ตัวเองรับผิดชอบ:
// ตีกลับ · การอัปเดตจากคนอื่น · ใกล้/เลยกำหนด · รอเซ็นนาน
// id ผูกกับสถานะนั้น ๆ เมื่อสถานะเปลี่ยนจะได้รายการใหม่ (ยังไม่อ่าน) อีกครั้ง
export function buildNotifications({ tasks, events, userId, today = todayISO() }) {
  const mine = tasks.filter((t) => t.ownerId === userId);
  const items = [];

  for (const task of mine) {
    for (const doc of task.documents) {
      if (doc.status === 'returned') {
        items.push({
          id: `returned:${doc.id}:${doc.changedAt}`,
          kind: 'returned',
          rank: 0,
          at: doc.changedAt,
          title: `${doc.name} ถูกตีกลับ`,
          detail: `${task.title} · ${doc.holder}: ${doc.reason}`,
          taskId: task.id,
          docId: doc.id,
        });
      }
      const days = daysInStatus(doc, today);
      if (doc.status === 'waiting' && days >= WAIT_ALERT_DAYS) {
        items.push({
          id: `waiting:${doc.id}:${doc.changedAt}`,
          kind: 'waiting',
          rank: 3,
          at: doc.changedAt,
          title: `${doc.name} รอ ${doc.holder} ${days} วัน`,
          detail: `${task.title} · ลองตามลายเซ็น`,
          taskId: task.id,
          docId: doc.id,
        });
      }
    }

    const left = daysLeft(task, today);
    if (!isTaskComplete(task) && left <= DUE_ALERT_DAYS) {
      const { passed, total } = progressOf(task);
      items.push({
        id: `due:${task.id}:${task.dueDate}:${left < 0 ? 'late' : left}`,
        kind: 'due',
        rank: 2,
        at: `${today}T00:00:00`,
        title: left < 0 ? `เลยกำหนด ${-left} วัน` : left === 0 ? 'ครบกำหนดวันนี้' : `อีก ${left} วันครบกำหนด`,
        detail: `${task.title} · ยังไม่ผ่าน ${total - passed} รายการ`,
        taskId: task.id,
        docId: null,
      });
    }
  }

  // การอัปเดตจากคนอื่นในงานของฉัน (ตีกลับมีรายการของตัวเองแล้วข้างบน)
  const mineIds = new Set(mine.map((t) => t.id));
  for (const ev of events) {
    if (!mineIds.has(ev.taskId) || ev.actorId === userId || ev.toStatus === 'returned') continue;
    if (daysBetween(toISO(new Date(ev.createdAt)), today) > EVENT_DAYS) continue;
    const task = mine.find((t) => t.id === ev.taskId);
    items.push({
      id: `event:${ev.id}`,
      kind: ev.toStatus === 'passed' ? 'passed' : 'event',
      rank: 1,
      at: ev.createdAt,
      title: `${ev.docName}: ${docStatusLabel(ev.toStatus)}${ev.holder ? ` · ${ev.holder}` : ''}`,
      detail: `${task.title} · บันทึกโดย ${ev.actorName}`,
      taskId: ev.taskId,
      docId: ev.documentId,
    });
  }

  return items
    .sort((a, b) => a.rank - b.rank || String(b.at).localeCompare(String(a.at)))
    .map((item) => ({ ...item, when: item.kind === 'due' ? 'วันนี้' : whenText(item.at, today) }));
}
