// ทางเดียวที่หน้าจอใช้คุยกับข้อมูล (ตามกฎ AGENTS.md)
// - ใส่ค่าใน data/config.js แล้ว → คุยกับ Supabase (Auth + ตาราง categories / templates / tasks / task_documents / document_events)
// - ยังไม่ใส่ค่า → โหมดสาธิต ใช้ข้อมูลในหน่วยความจำจาก data/demoStore.js
// ทุกฟังก์ชันคืน Promise และโยน Error ที่มีข้อความภาษาไทย ให้หน้าจอนำไปแสดงได้เลย
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { IS_SUPABASE_CONFIGURED } from './config';
import { DEMO_ACCOUNT, DEMO_CATEGORIES, DEMO_TEMPLATES, createDemoData, newId } from './demoStore';
import { isValidISO, addDaysISO, todayISO } from '../utils/dates';
import { buildNotifications } from '../utils/notifications';

export const IS_DEMO = !IS_SUPABASE_CONFIGURED;
export const SIMULATE_ERROR = false; // true = ทดสอบหน้าจอ error (โหลดข้อมูลไม่สำเร็จ)

const DEMO_DELAY_MS = 350;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const STATUSES = ['draft', 'waiting', 'sent', 'returned', 'passed'];

// ---------- ข้อความผิดพลาด ----------

function thaiError(error) {
  const msg = String(error?.message || error || '');
  if (/invalid login credentials/i.test(msg)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if (/already registered|already exists/i.test(msg)) return 'อีเมลนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ';
  if (/email not confirmed/i.test(msg)) return 'ยังไม่ได้ยืนยันอีเมล กรุณากดลิงก์ในอีเมลก่อน';
  if (/password should be at least/i.test(msg)) return 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร';
  if (/rate limit/i.test(msg)) return 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
  if (/failed to fetch|network/i.test(msg)) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
  if (/row-level security|permission denied/i.test(msg)) return 'คุณไม่มีสิทธิ์แก้ไขรายการนี้';
  if (/reason required/i.test(msg)) return 'กรุณาเลือกเหตุผลที่ตีกลับ';
  if (/document not found/i.test(msg)) return 'ไม่พบเอกสารนี้ อาจถูกลบไปแล้ว';
  return msg ? `เกิดข้อผิดพลาด: ${msg}` : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
}

function fail(error) {
  throw new Error(thaiError(error));
}

// ---------- ตรวจข้อมูล (ใช้ทั้งโหมดสาธิตและ Supabase) ----------

export function validateCredentials({ name, email, password }, { isSignUp = false } = {}) {
  const errors = {};
  if (isSignUp && !(name || '').trim()) errors.name = 'กรุณากรอกชื่อ-นามสกุล';
  if (!/^\S+@\S+\.\S+$/.test((email || '').trim())) errors.email = 'กรุณากรอกอีเมลให้ถูกต้อง เช่น name@sut.ac.th';
  if ((password || '').length < 6) errors.password = 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร';
  return errors;
}

// isCreate: ตอนสร้างต้องเลือกแม่แบบด้วย
export function validateTask(input, { isCreate = false } = {}) {
  const errors = {};
  if (isCreate && !input.templateKey) errors.templateKey = 'กรุณาเลือกแม่แบบ';
  const title = (input.title || '').trim();
  if (!title) errors.title = 'กรุณากรอกชื่องาน';
  else if (title.length > 120) errors.title = 'ชื่องานยาวได้ไม่เกิน 120 ตัวอักษร';
  if (!input.categoryId) errors.categoryId = 'กรุณาเลือกหมวดงาน';
  if (!(input.accountOwner || '').trim()) errors.accountOwner = 'กรุณาระบุเจ้าของบัญชี เพื่อให้รู้ว่าต้องส่งเซ็นที่ใคร';
  if (!isValidISO(input.dueDate)) errors.dueDate = 'กรุณาเลือกกำหนดส่ง';
  return errors;
}

function assertValid(errors) {
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
}

function cleanDocName(name) {
  const clean = (name || '').trim();
  if (!clean) throw new Error('กรุณาพิมพ์ชื่อเอกสารก่อนกดเพิ่ม');
  if (clean.length > 120) throw new Error('ชื่อเอกสารยาวได้ไม่เกิน 120 ตัวอักษร');
  return clean;
}

// ---------- แปลงแถวจาก Supabase เป็นรูปที่หน้าจอใช้ ----------

function toDocument(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    position: row.position,
    name: row.name,
    status: row.status,
    holder: row.holder || '',
    reason: row.reason || '',
    dest: row.dest || '',
    personal: !!row.personal,
    changedAt: row.changed_at,
  };
}

function toTask(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    templateKey: row.template_key,
    title: row.title,
    description: row.description || '',
    accountOwner: row.account_owner || '',
    recipient: row.recipient || '',
    dueDate: row.due_date,
    ownerId: row.owner_id,
    ownerName: row.owner?.full_name || 'สมาชิกแล็บ',
    createdAt: row.created_at,
    documents: (row.task_documents || []).map(toDocument).sort((a, b) => a.position - b.position),
  };
}

function toEvent(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    documentId: row.document_id,
    docName: row.doc_name,
    actorId: row.actor_id,
    actorName: row.actor?.full_name || 'สมาชิกแล็บ',
    fromStatus: row.from_status,
    toStatus: row.to_status,
    holder: row.holder || '',
    reason: row.reason || '',
    note: row.note || '',
    createdAt: row.created_at,
  };
}

function toTemplate(row) {
  return { key: row.key, name: row.name, categoryKey: row.category_key, dest: row.dest || '', documents: row.documents || [] };
}

function toUser(authUser) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
  };
}

const TASK_SELECT = '*, owner:profiles(full_name), task_documents(*)';
const EVENT_SELECT = '*, actor:profiles(full_name)';

// ---------- โหมดสาธิต: state ในหน่วยความจำ ----------

const demo = { user: null, data: null, seen: {} };

function demoData() {
  if (!demo.data) demo.data = createDemoData(demo.user?.id ?? 'u-demo', demo.user?.name ?? DEMO_ACCOUNT.name);
  return demo.data;
}

function demoFind(id) {
  const task = demoData().tasks.find((t) => t.id === id);
  if (!task) throw new Error('ไม่พบงานนี้ อาจถูกลบไปแล้ว');
  return task;
}

function demoFindDoc(taskId, docId) {
  const doc = demoFind(taskId).documents.find((d) => d.id === docId);
  if (!doc) throw new Error('ไม่พบเอกสารนี้ อาจถูกลบไปแล้ว');
  return doc;
}

const clone = (value) => JSON.parse(JSON.stringify(value));

// ---------- Auth ----------

export async function getCurrentUser() {
  if (IS_DEMO) return demo.user;
  const { data, error } = await supabase.auth.getSession();
  if (error) fail(error);
  return toUser(data.session?.user);
}

// แจ้งเมื่อสถานะล็อกอินเปลี่ยน (เช่น token หมดอายุ) คืนฟังก์ชันยกเลิก
export function onAuthChange(callback) {
  if (IS_DEMO) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

export async function signIn({ email, password }) {
  assertValid(validateCredentials({ email, password }));
  const cleanEmail = email.trim().toLowerCase();
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    const name = cleanEmail === DEMO_ACCOUNT.email ? DEMO_ACCOUNT.name : cleanEmail.split('@')[0];
    demo.user = { id: 'u-demo', email: cleanEmail, name };
    return demo.user;
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) fail(error);
  return toUser(data.user);
}

// คืน { user, needsConfirm } · needsConfirm = true เมื่อโปรเจกต์ Supabase เปิด "Confirm email" ไว้
export async function signUp({ name, email, password }) {
  assertValid(validateCredentials({ name, email, password }, { isSignUp: true }));
  const cleanEmail = email.trim().toLowerCase();
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    demo.user = { id: 'u-demo', email: cleanEmail, name: name.trim() };
    demo.data = null;
    return { user: demo.user, needsConfirm: false };
  }
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: { data: { full_name: name.trim() } },
  });
  if (error) fail(error);
  return { user: data.session ? toUser(data.user) : null, needsConfirm: !data.session };
}

export async function signOut() {
  if (IS_DEMO) {
    await wait(150);
    demo.user = null;
    demo.data = null;
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) fail(error);
}

// ---------- หมวดงาน และแม่แบบ ----------

export async function fetchCategories() {
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    if (SIMULATE_ERROR) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    return clone(DEMO_CATEGORIES);
  }
  const { data, error } = await supabase.from('categories').select('id, key, name, description').order('sort');
  if (error) fail(error);
  return data;
}

// แม่แบบ = ความรู้ของคนเก่า: แต่ละแบบมีรายการเอกสารที่ต้องมีและปลายทาง
export async function fetchTemplates() {
  if (IS_DEMO) {
    await wait(150);
    return clone(DEMO_TEMPLATES);
  }
  const { data, error } = await supabase.from('templates').select('key, name, category_key, dest, documents').order('sort');
  if (error) fail(error);
  return data.map(toTemplate);
}

// ---------- งาน (CRUD) ----------

// งานทั้งแล็บ (ทุกคนที่ล็อกอินเห็นทุกงาน) พร้อมเอกสารที่ต้องมี
export async function fetchTasks() {
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    if (SIMULATE_ERROR) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    return clone(demoData().tasks);
  }
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).order('due_date');
  if (error) fail(error);
  return data.map(toTask);
}

export async function fetchTask(id) {
  if (IS_DEMO) {
    await wait(200);
    return clone(demoFind(id));
  }
  const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).single();
  if (error) fail(error);
  return toTask(data);
}

// input = { templateKey, title, categoryId, accountOwner, recipient, dueDate, description, documents: [{ name, personal }] }
// เอกสารทุกชิ้นเริ่มที่ "เตรียม" และมีปลายทาง = "ส่งให้" ของงาน
export async function createTask(input) {
  assertValid(validateTask(input, { isCreate: true }));
  const fields = {
    templateKey: input.templateKey,
    title: input.title.trim(),
    categoryId: input.categoryId,
    accountOwner: input.accountOwner.trim(),
    recipient: (input.recipient || '').trim(),
    dueDate: input.dueDate,
    description: (input.description || '').trim(),
  };
  const docs = (input.documents || []).filter((d) => (d.name || '').trim());
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    const id = newId('t');
    const task = {
      id,
      ...fields,
      ownerId: demo.user.id,
      ownerName: demo.user.name,
      createdAt: new Date().toISOString(),
      documents: docs.map((d, position) => ({
        id: newId('d'),
        taskId: id,
        position,
        name: d.name.trim(),
        status: 'draft',
        holder: '',
        reason: '',
        dest: '',
        personal: !!d.personal,
        changedAt: null,
      })),
    };
    demoData().tasks.push(task);
    return clone(task);
  }
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      template_key: fields.templateKey,
      title: fields.title,
      category_id: fields.categoryId,
      account_owner: fields.accountOwner,
      recipient: fields.recipient,
      due_date: fields.dueDate,
      description: fields.description,
    })
    .select('id')
    .single();
  if (error) fail(error);
  if (docs.length) {
    const rows = docs.map((d, position) => ({ task_id: data.id, name: d.name.trim(), personal: !!d.personal, position }));
    const { error: docError } = await supabase.from('task_documents').insert(rows);
    if (docError) fail(docError);
  }
  return fetchTask(data.id);
}

// patch = title, categoryId, accountOwner, recipient, dueDate, description (ส่งมาเฉพาะที่แก้)
export async function updateTask(id, patch) {
  if (IS_DEMO) {
    await wait(250);
    const task = demoFind(id);
    assertValid(validateTask({ ...task, ...patch }));
    Object.assign(task, patch, {
      title: (patch.title ?? task.title).trim(),
      accountOwner: (patch.accountOwner ?? task.accountOwner).trim(),
      recipient: (patch.recipient ?? task.recipient).trim(),
    });
    return clone(task);
  }
  const current = await fetchTask(id);
  assertValid(validateTask({ ...current, ...patch }));
  const row = {};
  if ('title' in patch) row.title = patch.title.trim();
  if ('description' in patch) row.description = patch.description.trim();
  if ('accountOwner' in patch) row.account_owner = patch.accountOwner.trim();
  if ('recipient' in patch) row.recipient = patch.recipient.trim();
  if ('categoryId' in patch) row.category_id = patch.categoryId;
  if ('dueDate' in patch) row.due_date = patch.dueDate;
  const { error } = await supabase.from('tasks').update(row).eq('id', id);
  if (error) fail(error);
  return fetchTask(id);
}

export async function deleteTask(id) {
  if (IS_DEMO) {
    await wait(250);
    const task = demoFind(id);
    if (task.ownerId !== demo.user.id) throw new Error('ลบได้เฉพาะงานที่คุณสร้าง');
    const data = demoData();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    data.events = data.events.filter((e) => e.taskId !== id);
    return;
  }
  // RLS อนุญาตให้ลบเฉพาะเจ้าของงาน ถ้าไม่ใช่เจ้าของ จะไม่มีแถวถูกลบ
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id');
  if (error) fail(error);
  if (!data.length) throw new Error('ลบได้เฉพาะงานที่คุณสร้าง');
}

// ---------- เอกสารที่ต้องมี (CRUD) ----------

export async function addDocument(taskId, name) {
  const clean = cleanDocName(name);
  if (IS_DEMO) {
    await wait(150);
    const task = demoFind(taskId);
    task.documents.push({
      id: newId('d'),
      taskId,
      position: task.documents.length,
      name: clean,
      status: 'draft',
      holder: '',
      reason: '',
      dest: '',
      personal: false,
      changedAt: null,
    });
    return;
  }
  const { error } = await supabase
    .from('task_documents')
    .insert({ task_id: taskId, name: clean, position: Date.now() % 1000000000 });
  if (error) fail(error);
}

export async function deleteDocument(taskId, docId) {
  if (IS_DEMO) {
    await wait(150);
    const task = demoFind(taskId);
    task.documents = task.documents.filter((d) => d.id !== docId);
    return;
  }
  const { error } = await supabase.from('task_documents').delete().eq('id', docId);
  if (error) fail(error);
}

// เปลี่ยนสถานะเอกสาร + บันทึกประวัติ (ใครเปลี่ยน เป็นอะไร รอใคร เหตุผล หมายเหตุ) ในครั้งเดียว
// Supabase: ฟังก์ชัน set_document_status ใน schema.sql ทำทั้งสองอย่างใน transaction เดียว
export async function setDocumentStatus(taskId, docId, { status, holder = '', reason = '', note = '' }) {
  if (!STATUSES.includes(status)) throw new Error('สถานะไม่ถูกต้อง');
  if (status === 'returned' && !reason.trim()) throw new Error('กรุณาเลือกเหตุผลที่ตีกลับ');
  if (IS_DEMO) {
    await wait(250);
    const doc = demoFindDoc(taskId, docId);
    const from = doc.status;
    Object.assign(doc, {
      status,
      holder: holder.trim(),
      reason: status === 'returned' ? reason.trim() : '',
      changedAt: new Date().toISOString(),
    });
    demoData().events.push({
      id: newId('e'),
      taskId,
      documentId: docId,
      docName: doc.name,
      actorId: demo.user.id,
      actorName: demo.user.name,
      fromStatus: from,
      toStatus: status,
      holder: doc.holder,
      reason: doc.reason,
      note: note.trim(),
      createdAt: doc.changedAt,
    });
    return;
  }
  const { error } = await supabase.rpc('set_document_status', {
    p_document_id: docId,
    p_status: status,
    p_holder: holder,
    p_reason: reason,
    p_note: note,
  });
  if (error) fail(error);
}

// ---------- ประวัติ และการแจ้งเตือน ----------

// ประวัติของงาน ใหม่สุดก่อน (ให้คนที่รับงานต่อเห็นว่าใครทำอะไรไปแล้ว)
export async function fetchTaskEvents(taskId) {
  if (IS_DEMO) {
    await wait(150);
    return clone(demoData().events.filter((e) => e.taskId === taskId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await supabase
    .from('document_events')
    .select(EVENT_SELECT)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) fail(error);
  return data.map(toEvent);
}

async function recentEvents() {
  if (IS_DEMO) return clone(demoData().events);
  const since = `${addDaysISO(todayISO(), -7)}T00:00:00`;
  const { data, error } = await supabase
    .from('document_events')
    .select(EVENT_SELECT)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) fail(error);
  return data.map(toEvent);
}

// รายการที่อ่านแล้วเก็บในเครื่อง (ต่อผู้ใช้) · อ่านไม่ได้ให้ถือว่ายังไม่อ่าน
const seenKey = (userId) => `irish.seen.${userId}`;

async function getSeen(userId) {
  if (IS_DEMO) return demo.seen[userId] || [];
  try {
    return JSON.parse((await AsyncStorage.getItem(seenKey(userId))) || '[]');
  } catch {
    return [];
  }
}

export async function markNotificationsSeen(userId, ids) {
  const seen = new Set(await getSeen(userId));
  ids.forEach((id) => seen.add(id));
  const list = [...seen].slice(-300);
  if (IS_DEMO) {
    demo.seen[userId] = list;
    return;
  }
  try {
    await AsyncStorage.setItem(seenKey(userId), JSON.stringify(list));
  } catch {
    // เก็บไม่ได้ (เช่น พื้นที่เต็ม) ไม่กระทบการใช้งาน
  }
}

// คืน { items: [{ ...รายการ, unread }], unread: จำนวนที่ยังไม่อ่าน }
export async function fetchNotifications(user) {
  const [tasks, events, seen] = await Promise.all([fetchTasks(), recentEvents(), getSeen(user.id)]);
  const seenSet = new Set(seen);
  const items = buildNotifications({ tasks, events, userId: user.id }).map((item) => ({ ...item, unread: !seenSet.has(item.id) }));
  return { items, unread: items.filter((i) => i.unread).length };
}
