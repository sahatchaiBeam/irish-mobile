import { todayISO, toISO, daysBetween, formatShortDate } from './dates';

// สถานะเอกสาร (ตรงกับคอลัมน์ task_documents.status และสถานะเอกสารในเว็บ irish-docs)
export const DOC_STATUSES = {
  draft: { label: 'เตรียม', icon: 'ellipse-outline' },
  waiting: { label: 'รอเซ็น', icon: 'hourglass-outline' },
  sent: { label: 'ส่งแล้ว', icon: 'paper-plane-outline' },
  returned: { label: 'ตีกลับ', icon: 'arrow-undo-outline' },
  passed: { label: 'ผ่าน', icon: 'checkmark-circle-outline' },
};

export const RETURN_REASONS = ['ขาดลายเซ็น', 'เอกสารไม่ครบ', 'ข้อมูลไม่ตรงกัน', 'วันที่ไม่ถูกต้อง'];

export function docStatusLabel(status) {
  return DOC_STATUSES[status]?.label ?? status;
}

// ปลายทางของเอกสาร (หน่วยงานที่ตรวจ/อนุมัติ) ถ้าไม่ได้ระบุใช้ "ส่งให้" ของงาน
export function destOf(task, doc) {
  return doc.dest || task.recipient || 'ผู้รับเอกสาร';
}

// "ยื่นให้ อ.เจ้าของโครงการแล้ว" · ชื่อที่ลงท้ายด้วยวงเล็บเว้นวรรคก่อน "แล้ว" ให้อ่านง่าย
function submittedTo(name) {
  return `ยื่นให้ ${name}${/\)$/.test(name) ? ' ' : ''}แล้ว`;
}

// เส้นทางตัวอย่าง (ยังไม่ได้ยืนยันกับขั้นตอนจริง):
// เตรียม → รอเซ็น (เจ้าของบัญชี) → ส่งแล้ว (ปลายทาง) → ผ่าน · ตีกลับได้ตอนรอเซ็นหรือส่งแล้ว แก้แล้วยื่นคนเดิมใหม่
// คืน { status, holder, label, hint } ของปุ่มใหญ่ หรือ null เมื่อผ่านแล้ว
export function nextStep(task, doc) {
  const dest = destOf(task, doc);
  switch (doc.status) {
    case 'draft':
      return { status: 'waiting', holder: task.accountOwner, label: submittedTo(task.accountOwner), hint: 'สถานะจะเป็น "รอเซ็น"' };
    case 'waiting':
      return { status: 'sent', holder: dest, label: `เซ็นแล้ว · ส่ง${dest}`, hint: 'สถานะจะเป็น "ส่งแล้ว · รออนุมัติ"' };
    case 'sent':
      return { status: 'passed', holder: '', label: `${dest} อนุมัติแล้ว`, hint: 'เอกสารนี้จะ "ผ่าน"' };
    case 'returned':
      return doc.holder === task.accountOwner
        ? { status: 'waiting', holder: task.accountOwner, label: `แก้แล้ว · ยื่นให้ ${task.accountOwner} ใหม่`, hint: 'สถานะจะกลับเป็น "รอเซ็น"' }
        : { status: 'sent', holder: dest, label: `แก้แล้ว · ส่ง${dest}ใหม่`, hint: 'สถานะจะกลับเป็น "ส่งแล้ว"' };
    default:
      return null;
  }
}

export function canReturn(doc) {
  return doc.status === 'waiting' || doc.status === 'sent';
}

// แถบขั้นตอน 4 จุด: { labels, current } · current = 4 เมื่อผ่านครบ
export function stepsOf(task, doc) {
  const labels = ['เตรียม', 'รอเซ็น', `ส่ง${destOf(task, doc)}`, 'ผ่าน'];
  const current = {
    draft: 0,
    waiting: 1,
    sent: 2,
    returned: doc.holder === task.accountOwner ? 1 : 2,
    passed: 4,
  }[doc.status];
  return { labels, current };
}

// จำนวนวันตั้งแต่สถานะล่าสุดเปลี่ยน (นับตามวันในเครื่อง)
export function daysInStatus(doc, today = todayISO()) {
  if (!doc.changedAt) return 0;
  return Math.max(0, daysBetween(toISO(new Date(doc.changedAt)), today));
}

function agoText(days) {
  return days === 0 ? 'วันนี้' : `${days} วัน`;
}

// บรรทัดรองใต้ชื่อเอกสาร: รอใคร กี่วัน / ตีกลับเพราะอะไร
export function whoLine(doc, today = todayISO()) {
  const days = daysInStatus(doc, today);
  switch (doc.status) {
    case 'waiting':
      return `รอ ${doc.holder} · ${agoText(days)}`;
    case 'sent':
      return `อยู่กับ ${doc.holder} · ${agoText(days)}`;
    case 'returned':
      return `ตีกลับจาก ${doc.holder}: ${doc.reason}`;
    case 'passed':
      return doc.changedAt ? `ผ่านเมื่อ ${formatShortDate(toISO(new Date(doc.changedAt)))}` : 'ผ่านแล้ว';
    default:
      return 'ยังไม่ได้ยื่น';
  }
}

export function progressOf(task) {
  const total = task.documents.length;
  const passed = task.documents.filter((d) => d.status === 'passed').length;
  return { passed, total };
}

export function isTaskComplete(task) {
  const { passed, total } = progressOf(task);
  return total > 0 && passed === total;
}

export function countStatus(docs, status) {
  return docs.filter((d) => d.status === status).length;
}

// เอกสารชิ้นถัดไปที่ควรทำ: ตีกลับก่อน แล้วรอเซ็น ส่งแล้ว เตรียม · ไม่มีคืน null
export function nextOpenDoc(task) {
  for (const status of ['returned', 'waiting', 'sent', 'draft']) {
    const doc = task.documents.find((d) => d.status === status);
    if (doc) return doc;
  }
  return null;
}

// เอกสารที่ค้างอยู่กับคนอื่นนานที่สุด (รอเซ็น / ส่งแล้ว / ตีกลับ) ในรายการ { task, doc }
export function longestStuck(pairs, today = todayISO()) {
  return pairs
    .filter(({ doc }) => ['waiting', 'sent', 'returned'].includes(doc.status))
    .sort((a, b) => daysInStatus(b.doc, today) - daysInStatus(a.doc, today))[0] || null;
}
