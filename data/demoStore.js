// ข้อมูลโหมดสาธิต: ใช้ตอนยังไม่ได้ใส่ค่า Supabase ใน data/config.js
// เก็บในหน่วยความจำ (รีเฟรชแล้วกลับเป็นค่าเริ่มต้น) วันที่คิดจากวันนี้ จึงมีเอกสารรอเซ็น/ตีกลับให้ดูเสมอ
// ชื่อคนใช้บทบาท (นักศึกษา ป.โท, อ.เจ้าของโครงการ) ไม่ใช่ชื่อสมมติ
// หน้าจอห้าม import ไฟล์นี้ตรง ๆ ให้เรียกผ่าน data/api.js เท่านั้น
import { todayISO, addDaysISO } from '../utils/dates';

export const DEMO_ACCOUNT = { email: 'demo@irish.lab', password: 'irish1234', name: 'นักศึกษา ป.โท' };

export const DEMO_CATEGORIES = [
  { id: 1, key: 'procurement', name: 'จัดซื้อจัดจ้าง', description: 'ใบเสนอราคา บันทึกขอซื้อ ตรวจรับพัสดุ' },
  { id: 2, key: 'coordination', name: 'ประสานงาน', description: 'หนังสือเชิญ หนังสือขอความอนุเคราะห์' },
  { id: 3, key: 'venue', name: 'สถานที่', description: 'จองห้อง ขอใช้สถานที่ และอุปกรณ์' },
  { id: 4, key: 'training', name: 'อบรม', description: 'โครงการอบรม เอกสารเบิกจ่าย ภาพถ่ายประกอบ' },
];

// แม่แบบงาน: รายการเอกสารที่ต้องมี (อบรม ตามเว็บ irish-docs แต่เรียก "เอกสารเบิกงบ" ตามคำที่ผู้ใช้ใช้ · จัดซื้อ ตาม prototype)
export const DEMO_TEMPLATES = [
  {
    key: 'training',
    name: 'งานอบรม / กิจกรรม',
    categoryKey: 'training',
    dest: 'การเงิน',
    documents: [
      { name: 'โครงการ / หนังสืออนุมัติ' },
      { name: 'เอกสารจัดซื้อจัดจ้าง' },
      { name: 'เอกสารเบิกงบ' },
      { name: 'เอกสารค่าจ้าง TA / วิทยากร' },
      { name: 'รายชื่อผู้เข้าอบรม', personal: true },
      { name: 'สรุปผลการจัดอบรม' },
    ],
  },
  {
    key: 'procurement',
    name: 'จัดซื้อจัดจ้าง',
    categoryKey: 'procurement',
    dest: 'พัสดุ',
    documents: [
      { name: 'บันทึกขอซื้อ' },
      { name: 'ใบเสนอราคา 3 ราย' },
      { name: 'ตารางเปรียบเทียบราคา' },
      { name: 'ใบสั่งซื้อ' },
      { name: 'ใบตรวจรับพัสดุ' },
    ],
  },
  { key: 'general', name: 'งานทั่วไป', categoryKey: null, dest: '', documents: [] },
];

let nextId = 100;
export function newId(prefix) {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (h) => new Date(Date.now() - h * HOUR_MS).toISOString();
const daysAgo = (d) => hoursAgo(d * 24);

const OWNER = 'อ.เจ้าของโครงการ';
const PREV = { id: 'u-prev', name: 'ผู้รับผิดชอบคนก่อน' };
const PHD = { id: 'u-phd', name: 'นักศึกษา ป.เอก' };

// doc(ชื่อ, สถานะ, { holder, reason, changedAt, personal, dest })
function doc(taskId, position, name, status = 'draft', extra = {}) {
  return {
    id: newId('d'),
    taskId,
    position,
    name,
    status,
    holder: extra.holder || '',
    reason: extra.reason || '',
    dest: extra.dest || '',
    personal: !!extra.personal,
    changedAt: extra.changedAt || null,
  };
}

// คืน { tasks, events } · งาน 3 งานแรกเป็นของผู้ใช้สาธิต อีก 2 งานเป็นของเพื่อนในแล็บ (ให้หน้าภาพรวมมีข้อมูล)
export function createDemoData(ownerId, ownerName) {
  const today = todayISO();
  const me = { id: ownerId, name: ownerName };
  const base = (id, owner) => ({ id, ownerId: owner.id, ownerName: owner.name, createdAt: daysAgo(30), description: '' });

  const ros = {
    ...base('t-ros', me),
    categoryId: 4,
    templateKey: 'training',
    title: 'อบรม ROS 2 รุ่นที่ 3',
    description: 'อบรมการใช้ ROS 2 กับหุ่นยนต์เคลื่อนที่ 2 วัน',
    accountOwner: OWNER,
    recipient: 'การเงิน',
    dueDate: addDaysISO(today, 8),
  };
  ros.documents = [
    doc(ros.id, 0, 'โครงการ / หนังสืออนุมัติ', 'passed', { changedAt: daysAgo(20) }),
    doc(ros.id, 1, 'เอกสารจัดซื้อจัดจ้าง', 'passed', { changedAt: daysAgo(10), dest: 'พัสดุ' }),
    doc(ros.id, 2, 'เอกสารเบิกงบ'),
    doc(ros.id, 3, 'เอกสารค่าจ้าง TA / วิทยากร', 'passed', { changedAt: daysAgo(6) }),
    doc(ros.id, 4, 'รายชื่อผู้เข้าอบรม', 'draft', { personal: true }),
    doc(ros.id, 5, 'สรุปผลการจัดอบรม'),
  ];

  const lidar = {
    ...base('t-lidar', me),
    categoryId: 1,
    templateKey: 'procurement',
    title: 'จัดซื้อชุดเซนเซอร์ LiDAR',
    description: 'ขอใบเสนอราคา 3 ราย เปรียบเทียบราคา และทำบันทึกขอซื้อ',
    accountOwner: OWNER,
    recipient: 'พัสดุ',
    dueDate: addDaysISO(today, 14),
  };
  lidar.documents = [
    doc(lidar.id, 0, 'บันทึกขอซื้อ', 'passed', { changedAt: daysAgo(9) }),
    doc(lidar.id, 1, 'ใบเสนอราคา 3 ราย', 'returned', { holder: 'พัสดุ', reason: 'ขาดลายเซ็นหัวหน้าโครงการ', changedAt: hoursAgo(2) }),
    doc(lidar.id, 2, 'ตารางเปรียบเทียบราคา', 'waiting', { holder: OWNER, changedAt: daysAgo(4) }),
    doc(lidar.id, 3, 'ใบสั่งซื้อ'),
    doc(lidar.id, 4, 'ใบตรวจรับพัสดุ'),
  ];

  const room = {
    ...base('t-room', me),
    categoryId: 3,
    templateKey: 'general',
    title: 'จองห้องประชุม Open House',
    accountOwner: OWNER,
    recipient: 'งานอาคารสถานที่',
    dueDate: addDaysISO(today, 22),
  };
  room.documents = [
    doc(room.id, 0, 'บันทึกขอใช้ห้อง', 'sent', { holder: 'งานอาคารสถานที่', changedAt: daysAgo(2) }),
    doc(room.id, 1, 'แผนผังจัดห้อง'),
  ];

  const invite = {
    ...base('t-invite', PHD),
    categoryId: 2,
    templateKey: 'general',
    title: 'เชิญวิทยากรสัมมนา AI for Robotics',
    accountOwner: OWNER,
    recipient: 'คณบดี',
    dueDate: addDaysISO(today, 5),
  };
  invite.documents = [
    doc(invite.id, 0, 'หนังสือเชิญวิทยากร', 'waiting', { holder: OWNER, changedAt: daysAgo(2) }),
    doc(invite.id, 1, 'หนังสือขออนุมัติค่าตอบแทน'),
  ];

  const asset = {
    ...base('t-asset', PHD),
    categoryId: 1,
    templateKey: 'procurement',
    title: 'ตรวจรับครุภัณฑ์คอมพิวเตอร์',
    accountOwner: OWNER,
    recipient: 'พัสดุ',
    dueDate: addDaysISO(today, -1),
  };
  asset.documents = [
    doc(asset.id, 0, 'ใบตรวจรับพัสดุ', 'sent', { holder: 'พัสดุ', changedAt: daysAgo(3) }),
    doc(asset.id, 1, 'รายงานผลการตรวจรับ'),
  ];

  const tasks = [ros, lidar, room, invite, asset];

  // ประวัติ: งานอบรมเริ่มโดยคนก่อน (คนใหม่เปิดดูได้ว่าทำอะไรไปแล้ว) · ใบเสนอราคาถูกตีกลับ เพื่อนในแล็บเป็นคนบันทึก
  const event = (task, d, actor, fromStatus, toStatus, at, extra = {}) => ({
    id: newId('e'),
    taskId: task.id,
    documentId: d.id,
    docName: d.name,
    actorId: actor.id,
    actorName: actor.name,
    fromStatus,
    toStatus,
    holder: extra.holder || '',
    reason: extra.reason || '',
    note: extra.note || '',
    createdAt: at,
  });
  const [rosApproval, rosProcure, , rosTA] = ros.documents;
  const [lidarMemo, lidarQuote, lidarCompare] = lidar.documents;
  const events = [
    event(ros, rosApproval, PREV, 'draft', 'waiting', daysAgo(24), { holder: OWNER }),
    event(ros, rosApproval, PREV, 'waiting', 'passed', daysAgo(20), { note: 'คณบดีอนุมัติโครงการแล้ว' }),
    event(ros, rosProcure, PREV, 'sent', 'passed', daysAgo(10), { note: 'ใบเสนอราคาห้องและอาหาร ผ่านพัสดุ' }),
    event(ros, rosTA, me, 'sent', 'passed', daysAgo(6)),
    event(lidar, lidarMemo, me, 'sent', 'passed', daysAgo(9)),
    event(lidar, lidarCompare, me, 'draft', 'waiting', daysAgo(4), { holder: OWNER }),
    event(lidar, lidarQuote, me, 'draft', 'sent', daysAgo(3), { holder: 'พัสดุ' }),
    event(lidar, lidarQuote, PHD, 'sent', 'returned', hoursAgo(2), { holder: 'พัสดุ', reason: 'ขาดลายเซ็นหัวหน้าโครงการ' }),
    event(room, room.documents[0], me, 'draft', 'sent', daysAgo(2), { holder: 'งานอาคารสถานที่' }),
  ];

  return { tasks, events };
}
