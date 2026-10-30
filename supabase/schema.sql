-- เลิกใช้ตั้งแต่ 30 ต.ค. 2569: แอปใช้ตารางเดียวกับเว็บ irish-docs (migration ใน irish-docs/drizzle, 0020 = RLS + ฟังก์ชันที่แอปเรียก)
-- เก็บไฟล์นี้ไว้เป็นประวัติของ MVP v2 (ตารางเดิมย้ายไปอยู่ schema archive_mobile_v2 ใน Supabase)

-- IRISH Docs Mobile · Supabase schema v2 (ติดตามสถานะเอกสาร)
-- วิธีใช้: Supabase Dashboard › SQL Editor › New query › วางทั้งไฟล์ › Run (รันซ้ำได้ ไม่ลบข้อมูลเดิม)
--
-- ตาราง: profiles (ผู้ใช้) · categories (ส่วนงาน) · templates (แม่แบบ + รายการเอกสาร)
--        tasks (งาน) · task_documents (เอกสารที่ต้องมี + สถานะ) · document_events (ประวัติการเปลี่ยนสถานะ)
-- สิทธิ์ (Row Level Security) แบบย่อสำหรับ MVP:
--   - ทุกคนที่ล็อกอินแล้ว เห็นงานทั้งแล็บ และอัปเดตสถานะเอกสารได้ (ทำงานร่วมกัน / รับงานต่อ)
--   - สร้างงานได้ในชื่อตัวเองเท่านั้น · ลบงานได้เฉพาะผู้สร้าง · ประวัติเพิ่มได้อย่างเดียว ห้ามแก้/ลบ

-- ---------- profiles: สร้างอัตโนมัติเมื่อมีคนสมัคร ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories (ส่วนงาน ในหน้าภาพรวม) ----------
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  key text not null unique,            -- ใช้เลือกสีและไอคอนในแอป (theme.js › categoryStyle)
  name text not null,
  description text not null default '',
  sort int not null default 0
);

insert into public.categories (key, name, description, sort) values
  ('procurement',  'จัดซื้อจัดจ้าง', 'ใบเสนอราคา บันทึกขอซื้อ ตรวจรับพัสดุ', 1),
  ('coordination', 'ประสานงาน',     'หนังสือเชิญ หนังสือขอความอนุเคราะห์', 2),
  ('venue',        'สถานที่',        'จองห้อง ขอใช้สถานที่ และอุปกรณ์', 3),
  ('training',     'อบรม',          'โครงการอบรม เอกสารเบิกจ่าย ภาพถ่ายประกอบ', 4)
on conflict (key) do nothing;

-- ---------- templates: ความรู้ของคนเก่า "งานนี้ต้องใช้เอกสารอะไร ส่งที่ไหน" ----------
create table if not exists public.templates (
  key text primary key,
  name text not null,
  category_key text references public.categories (key),  -- null = ให้ผู้ใช้เลือกหมวดเอง
  dest text not null default '',                         -- ปลายทางเริ่มต้น ("ส่งให้")
  documents jsonb not null default '[]',                 -- [{ "name": "...", "personal": true }]
  sort int not null default 0
);

insert into public.templates (key, name, category_key, dest, documents, sort) values
  ('training', 'งานอบรม / กิจกรรม', 'training', 'การเงิน',
   '[{"name":"โครงการ / หนังสืออนุมัติ"},{"name":"เอกสารจัดซื้อจัดจ้าง"},{"name":"เอกสารเบิกงบ"},{"name":"เอกสารค่าจ้าง TA / วิทยากร"},{"name":"รายชื่อผู้เข้าอบรม","personal":true},{"name":"สรุปผลการจัดอบรม"}]', 1),
  ('procurement', 'จัดซื้อจัดจ้าง', 'procurement', 'พัสดุ',
   '[{"name":"บันทึกขอซื้อ"},{"name":"ใบเสนอราคา 3 ราย"},{"name":"ตารางเปรียบเทียบราคา"},{"name":"ใบสั่งซื้อ"},{"name":"ใบตรวจรับพัสดุ"}]', 2),
  ('general', 'งานทั่วไป', null, '', '[]', 3)
on conflict (key) do nothing;

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  category_id bigint not null references public.categories (id),
  template_key text references public.templates (key),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '',
  account_owner text not null check (char_length(trim(account_owner)) between 1 and 120), -- เจ้าของบัญชี / ผู้เซ็น
  recipient text not null default '',   -- "ส่งให้" ปลายทางหลัก
  due_date date not null,
  -- "เสร็จ" ไม่เก็บ: คำนวณจากเอกสารผ่านครบทุกชิ้น · "เลยกำหนด" คำนวณจาก due_date
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_category_idx on public.tasks (category_id);
create index if not exists tasks_owner_idx on public.tasks (owner_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ---------- task_documents: เอกสารที่ต้องมี + สถานะ ----------
create table if not exists public.task_documents (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  position int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'waiting', 'sent', 'returned', 'passed')),
  holder text not null default '',      -- รอใคร / อยู่กับใคร / ใครตีกลับ
  reason text not null default '',      -- เหตุผลที่ตีกลับ
  dest text not null default '',        -- ปลายทางของเอกสารนี้ (ว่าง = ใช้ tasks.recipient)
  personal boolean not null default false, -- มีข้อมูลส่วนบุคคล (แสดงกุญแจ)
  changed_at timestamptz,               -- สถานะล่าสุดเปลี่ยนเมื่อไร (ใช้คำนวณ "กี่วัน")
  created_at timestamptz not null default now(),
  constraint returned_has_reason check (status <> 'returned' or char_length(trim(reason)) > 0)
);

create index if not exists task_documents_task_idx on public.task_documents (task_id);
create index if not exists task_documents_status_idx on public.task_documents (status);

-- ---------- document_events: ประวัติ (ใคร เปลี่ยนเป็นอะไร เมื่อไร) ----------
create table if not exists public.document_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  document_id uuid references public.task_documents (id) on delete set null,
  doc_name text not null,               -- เก็บชื่อไว้ ถ้าเอกสารถูกลบประวัติยังอ่านได้
  actor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('draft', 'waiting', 'sent', 'returned', 'passed')),
  holder text not null default '',
  reason text not null default '',
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists document_events_task_idx on public.document_events (task_id, created_at desc);
create index if not exists document_events_created_idx on public.document_events (created_at desc);

-- เปลี่ยนสถานะ + บันทึกประวัติในครั้งเดียว (security invoker: ใช้สิทธิ์ RLS ของผู้เรียก)
create or replace function public.set_document_status(
  p_document_id uuid, p_status text, p_holder text, p_reason text, p_note text
)
returns void
language plpgsql
security invoker set search_path = public
as $$
declare
  d public.task_documents;
begin
  select * into d from public.task_documents where id = p_document_id for update;
  if not found then
    raise exception 'document not found';
  end if;
  if p_status = 'returned' and coalesce(trim(p_reason), '') = '' then
    raise exception 'reason required';
  end if;

  update public.task_documents
     set status = p_status,
         holder = coalesce(trim(p_holder), ''),
         reason = case when p_status = 'returned' then trim(p_reason) else '' end,
         changed_at = now()
   where id = p_document_id;

  insert into public.document_events (task_id, document_id, doc_name, from_status, to_status, holder, reason, note)
  values (d.task_id, d.id, d.name, d.status, p_status, coalesce(trim(p_holder), ''),
          case when p_status = 'returned' then trim(p_reason) else '' end, left(coalesce(trim(p_note), ''), 300));
end;
$$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.templates enable row level security;
alter table public.tasks enable row level security;
alter table public.task_documents enable row level security;
alter table public.document_events enable row level security;

drop policy if exists "profiles: read" on public.profiles;
create policy "profiles: read" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "categories: read" on public.categories;
create policy "categories: read" on public.categories for select to authenticated using (true);

drop policy if exists "templates: read" on public.templates;
create policy "templates: read" on public.templates for select to authenticated using (true);

drop policy if exists "tasks: read" on public.tasks;
create policy "tasks: read" on public.tasks for select to authenticated using (true);
drop policy if exists "tasks: insert own" on public.tasks;
create policy "tasks: insert own" on public.tasks for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists "tasks: update" on public.tasks;
create policy "tasks: update" on public.tasks for update to authenticated
  using (true) with check (true);
drop policy if exists "tasks: delete own" on public.tasks;
create policy "tasks: delete own" on public.tasks for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "documents: all" on public.task_documents;
create policy "documents: all" on public.task_documents for all to authenticated
  using (exists (select 1 from public.tasks t where t.id = task_id))
  with check (exists (select 1 from public.tasks t where t.id = task_id));

drop policy if exists "events: read" on public.document_events;
create policy "events: read" on public.document_events for select to authenticated using (true);
drop policy if exists "events: insert own" on public.document_events;
create policy "events: insert own" on public.document_events for insert to authenticated
  with check (actor_id = auth.uid());

-- ---------- ข้อมูลตัวอย่าง (ไม่บังคับ) ----------
-- สมัครสมาชิกในแอปก่อน 1 บัญชี แล้วรันส่วนนี้ (เอาเครื่องหมาย -- ออกทั้งก้อน) เพื่อใส่งานตัวอย่างให้บัญชีแรก
-- do $$
-- declare
--   me uuid := (select id from public.profiles order by created_at limit 1);
--   ros uuid; lidar uuid;
-- begin
--   insert into public.tasks (category_id, template_key, title, description, account_owner, recipient, due_date, owner_id)
--   values ((select id from public.categories where key = 'training'), 'training', 'อบรม ROS 2 รุ่นที่ 3',
--           'อบรมการใช้ ROS 2 กับหุ่นยนต์เคลื่อนที่ 2 วัน', 'อ.เจ้าของโครงการ', 'การเงิน', current_date + 8, me)
--   returning id into ros;
--   insert into public.task_documents (task_id, name, position, status, personal, changed_at, dest) values
--     (ros, 'โครงการ / หนังสืออนุมัติ', 0, 'passed', false, now() - interval '20 days', ''),
--     (ros, 'เอกสารจัดซื้อจัดจ้าง', 1, 'passed', false, now() - interval '10 days', 'พัสดุ'),
--     (ros, 'เอกสารเบิกงบ', 2, 'draft', false, null, ''),
--     (ros, 'เอกสารค่าจ้าง TA / วิทยากร', 3, 'passed', false, now() - interval '6 days', ''),
--     (ros, 'รายชื่อผู้เข้าอบรม', 4, 'draft', true, null, ''),
--     (ros, 'สรุปผลการจัดอบรม', 5, 'draft', false, null, '');
--
--   insert into public.tasks (category_id, template_key, title, description, account_owner, recipient, due_date, owner_id)
--   values ((select id from public.categories where key = 'procurement'), 'procurement', 'จัดซื้อชุดเซนเซอร์ LiDAR',
--           'ขอใบเสนอราคา 3 ราย เปรียบเทียบราคา และทำบันทึกขอซื้อ', 'อ.เจ้าของโครงการ', 'พัสดุ', current_date + 14, me)
--   returning id into lidar;
--   insert into public.task_documents (task_id, name, position, status, holder, reason, changed_at) values
--     (lidar, 'บันทึกขอซื้อ', 0, 'passed', '', '', now() - interval '9 days'),
--     (lidar, 'ใบเสนอราคา 3 ราย', 1, 'returned', 'พัสดุ', 'ขาดลายเซ็นหัวหน้าโครงการ', now() - interval '2 hours'),
--     (lidar, 'ตารางเปรียบเทียบราคา', 2, 'waiting', 'อ.เจ้าของโครงการ', '', now() - interval '4 days'),
--     (lidar, 'ใบสั่งซื้อ', 3, 'draft', '', '', null),
--     (lidar, 'ใบตรวจรับพัสดุ', 4, 'draft', '', '', null);
-- end $$;
