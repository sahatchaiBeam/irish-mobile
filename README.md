# IRISH Docs Mobile — MVP (Expo + Supabase)

แอปมือถือติดตามงานเอกสารของ IRiSH Lab: ใช้เอกสารอะไร · ส่งให้ใคร · เอกสารอยู่ขั้นไหน (รอใคร กี่วัน) · ผลงานโครงงานหลักสูตร **การพัฒนาแพลตฟอร์มดิจิทัลและ UX/UI รุ่น 2**
คู่กับเว็บแอปที่ใช้งานจริงแล้ว: https://irish-docs.vercel.app (โฟลเดอร์ `../irish-docs`)

| เอกสาร | ใช้ทำอะไร |
|---|---|
| `APP_BRIEF.md` | แอปต้องทำอะไร: หน้าจอ, flow, กติกา, acceptance checks |
| `DESIGN.md` | Design tokens ตามสเปก Google DESIGN.md (สี ตัวอักษร ระยะ คอมโพเนนต์) |
| `AGENTS.md` | กฎสำหรับ AI coding tool (Codex / Claude Code) |
| `supabase/schema.sql` | ตารางฐานข้อมูล + Row Level Security |
| `../document_for_learn/IRISH-Project/` | Problem, Persona, Journey, Wireframe, Prototype, ผลทดสอบ, Pitch, Poster |

## 1. รันในเครื่อง (ไม่ต้องมี Supabase ก็ได้)

ต้องมี Node.js 20+

```bash
npm install
npx expo start
```
- กด `w` เปิดบนเว็บ หรือสแกน QR ด้วยแอป **Expo Go** (ต้องเป็น Expo Go ที่รองรับ SDK 54)
- มือถือต้องอยู่ Wi-Fi วงเดียวกับคอมพิวเตอร์ · ถ้าเครื่องมีหลายการ์ดเครือข่าย (เช่น VMware) แล้ว QR ชี้ผิด IP ให้ระบุ IP ของ Wi-Fi เอง (PowerShell):
  `$env:REACT_NATIVE_PACKAGER_HOSTNAME = '<IP Wi-Fi>'; npx expo start --lan`
- ถ้ายังไม่ได้ใส่ค่า Supabase แอปจะอยู่ใน **โหมดสาธิต**: บัญชี `demo@irish.lab` / `irish1234` (นักศึกษา ป.โท) ข้อมูลตัวอย่างอยู่ในหน่วยความจำ รีเฟรชแล้วรีเซ็ต
- เครื่อง RAM น้อย: ใช้ `npx expo start --web --max-workers 1`

## 2. เชื่อม Supabase (ฐานข้อมูล + Login จริง)

1. สมัคร/เข้า https://supabase.com → **New project** (Region: Southeast Asia (Singapore))
2. **SQL Editor → New query** → วางไฟล์ `supabase/schema.sql` (v2) ทั้งไฟล์ → **Run**
   ถ้าเคยรัน schema v1 (มีตาราง `checklist_items`) ให้ใช้โปรเจกต์ใหม่ เพราะตาราง `tasks` เปลี่ยนคอลัมน์
3. **Authentication → Sign In / Providers → Email**: สำหรับวัน demo แนะนำปิด **Confirm email** (สมัครแล้วเข้าได้ทันที)
   ถ้าเปิดไว้ แอปจะแจ้ง "สมัครสำเร็จ กรุณากดลิงก์ยืนยันในอีเมล…"
4. **Project Settings → API Keys**: คัดลอก **Project URL** และ **Publishable key** (`sb_publishable_…`) หรือ anon key แบบเดิม
   - รันในเครื่อง: คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่า (ไฟล์นี้ไม่ขึ้น Git)
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     ```
   - Expo Snack: แทนค่าตัวอย่างใน `data/config.js` ตรง ๆ (Snack อ่าน `.env` ไม่ได้)

   ห้ามใช้ `service_role` key เด็ดขาด
5. รันแอปใหม่ → หน้า Login จะไม่มีกล่อง "โหมดสาธิต" → กด **สมัครสมาชิก**
6. (ไม่บังคับ) ใส่งานตัวอย่าง: สมัคร 1 บัญชีก่อน แล้วเอา `--` ออกจากก้อน "ข้อมูลตัวอย่าง" ท้าย `schema.sql` แล้วรันเฉพาะก้อนนั้น

ตรวจว่าเชื่อมสำเร็จ: หน้าโปรไฟล์แสดง "เชื่อมต่อ Supabase แล้ว" · สร้างงานแล้วเห็นแถวใหม่ใน **Table Editor → tasks / task_documents** · อัปเดตสถานะแล้วเห็นแถวใน **document_events**

### 2.1 เข้าสู่ระบบด้วย Google (ไม่บังคับ)

ปุ่ม "เข้าสู่ระบบด้วย Google" แสดงเฉพาะโหมด Supabase · ใช้ OAuth client ตัวเดียวกับเว็บแอปได้
1. **Google Cloud Console → APIs & Services → Credentials →** OAuth client (Web application) ตัวที่เว็บใช้ → **Authorized redirect URIs** เพิ่ม
   `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Sign In / Providers → Google** → เปิด → วาง **Client ID** และ **Client Secret** → Save
3. **Supabase → Authentication → URL Configuration → Redirect URLs** มี `http://localhost:8081/**` (เว็บ) และ `exp://**` (Expo Go)
4. ถ้า OAuth consent screen ของ Google ยังเป็นโหมด Testing ต้องเพิ่มอีเมลผู้ทดสอบใน Test users ก่อน

การทำงาน: เว็บเด้งไปหน้า Google แล้วกลับมาหน้าเดิม · มือถือเปิดเบราว์เซอร์ระบบ (`expo-web-browser`) แล้วรับ token จากลิงก์ `exp://…/--/auth-callback` (`expo-linking`) · ผู้ใช้ใหม่ได้แถว `profiles` จากชื่อในบัญชี Google อัตโนมัติ

## 3. ขึ้น Expo Snack (Workshop 4)

`snack.config.json` เตรียมไว้แล้ว (SDK 54, ไฟล์ `.js` ครบ, dependencies ครบ)
1. เปิดโปรเจกต์ด้วย Snack Local plugin ตามขั้นตอนใน Workshop 4 (https://ptrps.com/Workshop5-4.html)
2. เปลี่ยน `"name"` เป็น `boi-c05-<ชื่อเล่น>-<เลข4หลัก>` ตอนเปิดครั้งแรก
3. เปิด web preview ตรวจด้วยตาว่าไม่มีจอแดง แล้ว **Save** ได้ลิงก์ `snack.expo.dev/@user/name`
4. Snack ที่บันทึกแล้วเป็นสาธารณะ: ถ้าใส่ anon key ไว้ ข้อมูลยังปลอดภัยด้วย RLS แต่ถ้าจะแชร์ลิงก์กว้าง ๆ ให้ใช้โหมดสาธิต

## 4. โครงสร้าง

```
App.js            ฟอนต์ · session · stack หน้า (useState) · แท็บล่าง · ข้อความแจ้งผล
theme.js          token จาก DESIGN.md (ที่เดียวที่มี hex / ตัวเลขขนาด)
data/api.js       ทางเดียวที่หน้าจอใช้คุยกับข้อมูล (Supabase หรือโหมดสาธิต)
screens/          Login · Home · Overview · Section · TaskDetail · TaskForm · Notifications · Profile
components/       Button Chip Header TaskCard StatusBadge DocRow StatusSheet ... (15 ชิ้น)
utils/            dates · docStatus (สถานะเอกสาร) · taskStatus · notifications
supabase/         schema.sql
```

**สถาปัตยกรรม:** แอป (React Native) → `@supabase/supabase-js` → Supabase Auth (JWT) + PostgreSQL (REST อัตโนมัติจาก PostgREST) → Row Level Security ตรวจสิทธิ์ทุกคำขอที่ฐานข้อมูล

## 5. ตรวจรับ (Acceptance)

ทำตาม `APP_BRIEF.md` ข้อ 8 ทั้ง 9 ข้อ · ผลทดสอบบันทึกไว้ที่ `../document_for_learn/IRISH-Project/08_Test-Report.md`
