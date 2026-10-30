// ทางเดียวที่หน้าจอใช้คุยกับข้อมูล (ตามกฎ AGENTS.md)
// - ใส่ค่า Supabase แล้ว → ใช้ฐานข้อมูลเดียวกับเว็บ irish-docs (https://irish-docs.vercel.app)
//   อ่าน: ตาราง user / categories (ทีม) / tasks / task_recipients / task_doc_states / activity (ผ่าน RLS)
//   เขียน: ฟังก์ชันในฐานข้อมูล create_task / update_task / delete_task / add_doc_slot / remove_doc_slot / set_doc_state
//   (สร้างใน irish-docs/drizzle/0020_supabase_access.sql · ตรวจสิทธิ์และบันทึกประวัติเหมือนเว็บ)
// - ยังไม่ใส่ค่า → โหมดสาธิต ใช้ข้อมูลในหน่วยความจำจาก data/demoStore.js
// ทุกฟังก์ชันคืน Promise และโยน Error ที่มีข้อความภาษาไทย ให้หน้าจอนำไปแสดงได้เลย
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
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
  if (/provider is not enabled|unsupported provider/i.test(msg)) return 'ยังไม่ได้เปิดการเข้าสู่ระบบด้วย Google ใน Supabase';
  if (/failed to fetch|network/i.test(msg)) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
  if (/row-level security|permission denied/i.test(msg)) return 'คุณไม่มีสิทธิ์แก้ไขรายการนี้';
  if (/reason required/i.test(msg)) return 'กรุณาเลือกเหตุผลที่ตีกลับ';
  if (/document not found/i.test(msg)) return 'ไม่พบเอกสารนี้ อาจถูกลบไปแล้ว';
  if (/task not found/i.test(msg)) return 'ไม่พบงานนี้ อาจถูกลบไปแล้ว';
  if (/not in team/i.test(msg)) return 'สร้างงานได้เฉพาะคนในทีม ขอให้หัวหน้าทีมเพิ่มคุณเข้าทีมในเว็บก่อน';
  if (/forbidden/i.test(msg)) return 'คุณไม่มีสิทธิ์แก้งานนี้ (เฉพาะคนในงาน หัวหน้าทีม หรือแอดมิน)';
  if (/already exists/i.test(msg)) return 'มีเอกสารชื่อนี้ในงานแล้ว';
  if (/account owner required/i.test(msg)) return 'กรุณาระบุเจ้าของบัญชี เพื่อให้รู้ว่าต้องส่งเซ็นที่ใคร';
  if (/title required/i.test(msg)) return 'กรุณากรอกชื่องาน';
  if (/not signed in/i.test(msg)) return 'กรุณาเข้าสู่ระบบใหม่';
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

// ---------- แปลงแถวจาก Supabase (ตารางเดียวกับเว็บ) เป็นรูปที่หน้าจอใช้ ----------
// งาน = tasks · เอกสารที่ต้องมี = tasks.doc_slots (ชื่อ) + task_doc_states (สถานะ) · ประวัติ = activity "สถานะเอกสาร"
// id ของเอกสาร = ชื่อเอกสาร (เว็บใช้ task_id + ชื่อเป็นกุญแจ)

const STATUS_BY_LABEL = { ร่าง: 'draft', รอเซ็น: 'waiting', ส่งแล้ว: 'sent', ตีกลับ: 'returned', ผ่าน: 'passed' };
const PROCUREMENT_HINT = 'ใบเสนอราคา 3 ราย';
const TASK_SELECT =
  'id, category_id, title, description, type, doc_slots, account_owner, due_date, created_by, created_at, ' +
  'task_recipients(id, name), task_doc_states(label, status, waiting_user_id, waiting_name, returns, restricted, updated_at)';

// ชื่อคนในแล็บ (id → ชื่อ) จำไว้ 1 นาที
let people = { at: 0, byId: new Map() };
async function peopleById() {
  if (Date.now() - people.at < 60000) return people.byId;
  const { data, error } = await supabase.from('user').select('id, name');
  if (error) fail(error);
  people = { at: Date.now(), byId: new Map(data.map((u) => [u.id, u.name])) };
  return people.byId;
}

// แม่แบบในแอป ↔ ประเภทงานของเว็บ: งานอบรม = event · จัดซื้อ = งานทั่วไปที่มีใบเสนอราคา · งานระบบลูกค้า = ไม่มีแม่แบบ
function templateKeyOf(row) {
  if (row.type === 'event') return 'training';
  if (row.type === 'client') return null;
  return (row.doc_slots || []).includes(PROCUREMENT_HINT) ? 'procurement' : 'general';
}

function toTask(row, names) {
  const recipient = [...(row.task_recipients || [])].sort((a, b) => a.id - b.id)[0]?.name || '';
  const states = new Map((row.task_doc_states || []).map((st) => [st.label, st]));
  return {
    id: row.id,
    categoryId: row.category_id,
    templateKey: templateKeyOf(row),
    title: row.title,
    description: row.description || '',
    accountOwner: row.account_owner || '',
    recipient,
    dueDate: row.due_date,
    ownerId: row.created_by,
    ownerName: names.get(row.created_by) || 'สมาชิกแล็บ',
    createdAt: row.created_at,
    documents: (row.doc_slots || []).map((label, position) => {
      const st = states.get(label);
      const status = st?.status || 'draft';
      const open = (st?.returns || []).filter((r) => !r.done).map((r) => r.text);
      return {
        id: label,
        taskId: row.id,
        position,
        name: label,
        status,
        holder: (st?.waiting_user_id && names.get(st.waiting_user_id)) || st?.waiting_name || '',
        reason: status === 'returned' ? open.join(' · ') : '',
        dest: '',
        personal: !!st?.restricted,
        changedAt: st && status !== 'draft' ? st.updated_at : null,
      };
    }),
  };
}

// "เอกสารเบิกงบ: รอเซ็น → ตีกลับ (ขาดลายเซ็น) · หมายเหตุ: …" (รูปเดียวกับที่เว็บบันทึก)
const EVENT_RE = /^(.*): (ร่าง|รอเซ็น|ส่งแล้ว|ตีกลับ|ผ่าน) → (ร่าง|รอเซ็น|ส่งแล้ว|ตีกลับ|ผ่าน)(?: \((.*?)\))?(?: · หมายเหตุ: (.*))?$/s;

function toEvent(row, names) {
  const m = EVENT_RE.exec(row.detail || '');
  if (!m) return null;
  const [, docName, fromLabel, toLabel, extra = '', note = ''] = m;
  const toStatus = STATUS_BY_LABEL[toLabel];
  return {
    id: `a${row.id}`,
    taskId: row.task_id,
    documentId: docName,
    docName,
    actorId: row.user_id,
    actorName: names.get(row.user_id) || 'สมาชิกแล็บ',
    fromStatus: STATUS_BY_LABEL[fromLabel],
    toStatus,
    holder: toStatus === 'returned' ? '' : extra.replace(/^(รอใคร|ส่งให้) /, ''),
    reason: toStatus === 'returned' ? extra : '',
    note,
    createdAt: row.created_at,
  };
}

async function fetchEvents(filter) {
  const query = filter(supabase.from('activity').select('id, task_id, user_id, detail, created_at').eq('action', 'สถานะเอกสาร'));
  const [names, { data, error }] = await Promise.all([peopleById(), query.order('created_at', { ascending: false })]);
  if (error) fail(error);
  return data.map((row) => toEvent(row, names)).filter(Boolean);
}

// บัญชี Supabase → แถวของคนนั้นในตาราง user ของเว็บ (trigger ในฐานข้อมูลสร้าง/จับคู่ด้วยอีเมลตอนสมัคร)
async function appUser(authUser) {
  if (!authUser) return null;
  const { data } = await supabase.from('user').select('id, name, email').eq('auth_id', authUser.id).maybeSingle();
  if (data) return { id: data.id, email: data.email, name: data.name };
  return { id: authUser.id, email: authUser.email, name: authUser.user_metadata?.full_name || (authUser.email || '').split('@')[0] };
}

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
  return appUser(data.session?.user);
}

// แจ้งเมื่อสถานะล็อกอินเปลี่ยน (เช่น token หมดอายุ) คืนฟังก์ชันยกเลิก
export function onAuthChange(callback) {
  if (IS_DEMO) return () => {};
  // ห้ามเรียก supabase ภายใน callback โดยตรง (ค้างได้) จึงเลื่อนไปทำหลังจากนั้น
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => appUser(session?.user).then(callback), 0);
  });
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
  return appUser(data.user);
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
  return { user: data.session ? await appUser(data.user) : null, needsConfirm: !data.session };
}

// เข้าสู่ระบบด้วย Google (เฉพาะโหมด Supabase · ต้องเปิด provider Google ใน Supabase ก่อน)
// - เว็บ: เด้งไปหน้า Google แล้วกลับมาหน้าเดิม supabase อ่าน session จาก URL เอง → คืน null
// - มือถือ: เปิดเบราว์เซอร์ระบบ แล้วรับ token จากลิงก์ที่เด้งกลับ (Expo Go: exp://…/--/auth-callback)
// คืน null เมื่อผู้ใช้ปิดหน้า Google เอง
export async function signInWithGoogle() {
  if (IS_DEMO) throw new Error('โหมดสาธิตเข้าสู่ระบบได้ด้วยอีเมลเท่านั้น');
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) fail(error);
    return null;
  }
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) fail(error);
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;
  // token อยู่หลัง # (หรือ ? ถ้ามี error) ของลิงก์ที่เด้งกลับ
  const params = new URLSearchParams(result.url.split(/[?#]/).slice(1).join('&'));
  if (params.get('error_description')) fail(params.get('error_description'));
  if (!params.get('access_token')) throw new Error('ไม่ได้รับข้อมูลเข้าสู่ระบบจาก Google กรุณาลองใหม่');
  const { data: signedIn, error: sessionError } = await supabase.auth.setSession({
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
  });
  if (sessionError) fail(sessionError);
  return appUser(signedIn.user);
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
  // ทีมในเว็บ (หน้า "ภาพรวมแต่ละส่วน" แสดงตามทีม) · ไม่มี key จึงใช้ไอคอนกลาง
  const { data, error } = await supabase.from('categories').select('id, name, description').order('id');
  if (error) fail(error);
  return data.map((c) => ({ id: c.id, key: null, name: c.name, description: c.description || '' }));
}

// แม่แบบ = ความรู้ของคนเก่า: แต่ละแบบมีรายการเอกสารที่ต้องมีและปลายทาง
export async function fetchTemplates() {
  if (IS_DEMO) {
    await wait(150);
    return clone(DEMO_TEMPLATES);
  }
  // แม่แบบอยู่ในแอป (รายการเอกสารเดียวกับโหมดสาธิต) · ทีมให้ผู้ใช้เลือกเอง
  return clone(DEMO_TEMPLATES).map((t) => ({ ...t, categoryKey: null }));
}

// ---------- งาน (CRUD) ----------

// งานทั้งแล็บ (ทุกคนที่ล็อกอินเห็นทุกงาน) พร้อมเอกสารที่ต้องมี
export async function fetchTasks() {
  if (IS_DEMO) {
    await wait(DEMO_DELAY_MS);
    if (SIMULATE_ERROR) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    return clone(demoData().tasks);
  }
  // งานที่ยังทำอยู่ (งานที่เว็บกด "เสร็จ" แล้ว และต้นแบบงาน ไม่แสดง) · งานในถังขยะ RLS ซ่อนให้
  const [names, { data, error }] = await Promise.all([
    peopleById(),
    supabase.from('tasks').select(TASK_SELECT).neq('status', 'done').eq('is_example', false).order('due_date', { nullsFirst: false }),
  ]);
  if (error) fail(error);
  return data.map((row) => toTask(row, names));
}

export async function fetchTask(id) {
  if (IS_DEMO) {
    await wait(200);
    return clone(demoFind(id));
  }
  const [names, { data, error }] = await Promise.all([peopleById(), supabase.from('tasks').select(TASK_SELECT).eq('id', id).maybeSingle()]);
  if (error) fail(error);
  if (!data) throw new Error('ไม่พบงานนี้ อาจถูกลบไปแล้ว');
  return toTask(data, names);
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
  // งานอบรม = ประเภท event ของเว็บ (มีส่วนการเงิน/ภาพถ่าย) · เอกสารที่มีข้อมูลส่วนบุคคลล็อกให้ตามตั้งค่าในเว็บ
  const { data: id, error } = await supabase.rpc('create_task', {
    p_category_id: fields.categoryId,
    p_title: fields.title,
    p_type: fields.templateKey === 'training' ? 'event' : 'general',
    p_doc_slots: docs.map((d) => d.name.trim()),
    p_account_owner: fields.accountOwner,
    p_recipient: fields.recipient,
    p_due_date: fields.dueDate,
    p_description: fields.description,
  });
  if (error) fail(error);
  return fetchTask(id);
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
  // ย้ายทีมทำในเว็บ · ที่นี่แก้ชื่อ เจ้าของบัญชี ส่งให้ กำหนดส่ง รายละเอียด
  const current = await fetchTask(id);
  if ('categoryId' in patch && patch.categoryId !== current.categoryId) throw new Error('ย้ายงานไปทีมอื่นทำในเว็บ (หน้างาน → ย้ายงาน)');
  const next = { ...current, ...patch };
  assertValid(validateTask(next));
  const { error } = await supabase.rpc('update_task', {
    p_task_id: id,
    p_title: next.title.trim(),
    p_account_owner: next.accountOwner.trim(),
    p_recipient: (next.recipient || '').trim(),
    p_due_date: next.dueDate,
    p_description: (next.description || '').trim(),
  });
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
  // เหมือนลบในเว็บ: ย้ายไปถังขยะ (กู้คืนได้ในเว็บ) · ผู้สร้างงาน หัวหน้าทีม หรือแอดมินเท่านั้น
  const { error } = await supabase.rpc('delete_task', { p_task_id: id });
  if (error) {
    if (/forbidden/i.test(error.message)) throw new Error('ลบได้เฉพาะผู้สร้างงาน หัวหน้าทีม หรือแอดมิน');
    fail(error);
  }
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
  const { error } = await supabase.rpc('add_doc_slot', { p_task_id: taskId, p_label: clean });
  if (error) fail(error);
}

export async function deleteDocument(taskId, docId) {
  if (IS_DEMO) {
    await wait(150);
    const task = demoFind(taskId);
    task.documents = task.documents.filter((d) => d.id !== docId);
    return;
  }
  const { error } = await supabase.rpc('remove_doc_slot', { p_task_id: taskId, p_label: docId });
  if (error) fail(error);
}

// เปลี่ยนสถานะเอกสาร + บันทึกประวัติ (ใครเปลี่ยน เป็นอะไร รอใคร เหตุผล หมายเหตุ) ในครั้งเดียว
// Supabase: ฟังก์ชัน set_doc_state (irish-docs/drizzle/0020) ทำทั้งสองอย่างใน transaction เดียว และแจ้งเตือนคนที่ส่งให้ในเว็บ
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
  const { error } = await supabase.rpc('set_doc_state', {
    p_task_id: taskId,
    p_label: docId,
    p_status: status,
    p_who: holder,
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
  return fetchEvents((q) => q.eq('task_id', taskId).limit(50));
}

async function recentEvents() {
  if (IS_DEMO) return clone(demoData().events);
  const since = `${addDaysISO(todayISO(), -7)}T00:00:00`;
  return fetchEvents((q) => q.gte('created_at', since).limit(200));
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
