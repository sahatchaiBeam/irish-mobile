# IRISH Docs Mobile — MVP (Expo + Supabase)

แอปมือถือติดตามงานเอกสารของ IRiSH Lab: ใช้เอกสารอะไร · ส่งให้ใคร · เอกสารอยู่ขั้นไหน (รอใคร กี่วัน) · ผลงานโครงงานหลักสูตร **การพัฒนาแพลตฟอร์มดิจิทัลและ UX/UI รุ่น 2**
คู่กับเว็บแอปที่ใช้งานจริงแล้ว: https://irish-docs.vercel.app (โฟลเดอร์ `../irish-docs`)

| เอกสาร | ใช้ทำอะไร |
|---|---|
| `APP_BRIEF.md` | แอปต้องทำอะไร: หน้าจอ, flow, กติกา, acceptance checks |
| `DESIGN.md` | Design tokens ตามสเปก Google DESIGN.md (สี ตัวอักษร ระยะ คอมโพเนนต์) |
| `AGENTS.md` | กฎสำหรับ AI coding tool (Codex / Claude Code) |
| `supabase/schema.sql` | (เลิกใช้ 30 ต.ค. 69) ตารางของแอปเมื่อยังแยกจากเว็บ · ตอนนี้ใช้ตารางของเว็บ ดูข้อ 2 |
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
- เปิด QR ผ่านหน้าเว็บ: ระหว่างที่ `npx expo start` ทำงาน เปิด http://localhost:8081/expo-qr.html (ไฟล์ `public/expo-qr.html` อ่าน IP ที่ Expo ใช้อยู่แล้วสร้าง QR ให้ เปลี่ยน Wi-Fi แล้วสั่ง expo start ใหม่ แล้วรีเฟรชหน้า)
- Wi-Fi มหาวิทยาลัยมักกันมือถือคุยกับคอมพิวเตอร์โดยตรง: ใช้ฮอตสปอตของมือถือแทน หรือ `npx expo start --tunnel` (เปิดเซิร์ฟเวอร์ผ่านอินเทอร์เน็ต)
- ถ้ายังไม่ได้ใส่ค่า Supabase แอปจะอยู่ใน **โหมดสาธิต**: บัญชี `demo@irish.lab` / `irish1234` (นักศึกษา ป.โท) ข้อมูลตัวอย่างอยู่ในหน่วยความจำ รีเฟรชแล้วรีเซ็ต
- เครื่อง RAM น้อย: ใช้ `npx expo start --web --max-workers 1`

## 2. เชื่อม Supabase (ฐานข้อมูล + Login จริง)

ตั้งแต่ 30 ต.ค. 69 แอปมือถือกับเว็บ irish-docs (https://irish-docs.vercel.app) ใช้ **ฐานข้อมูลและบัญชีผู้ใช้ชุดเดียวกัน** ในโปรเจกต์ Supabase `irish-docs-mobile`
งานที่สร้างในแอปเห็นในเว็บทันที และกลับกัน

1. **ตาราง:** มาจาก migration ของเว็บ (`irish-docs/drizzle/`) ไม่ต้องรัน `supabase/schema.sql` อีก
   - `0019` เพิ่มช่องเจ้าของบัญชี (`tasks.account_owner`) และ `user.auth_id`
   - `0020` (เฉพาะ Supabase) เปิด RLS ทุกตาราง · ผูกบัญชี Supabase กับตาราง `user` ด้วยอีเมล · ฟังก์ชันที่แอปเรียก
     `create_task` `update_task` `delete_task` `add_doc_slot` `remove_doc_slot` `set_doc_state`
2. **ข้อมูลที่แอปใช้:** งาน = `tasks` · เอกสารที่ต้องมี = `tasks.doc_slots` + `task_doc_states` · ประวัติ = `activity` (action "สถานะเอกสาร") · ทีม = `categories`
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
5. รันแอปใหม่ → หน้า Login จะไม่มีกล่อง "โหมดสาธิต" → เข้าสู่ระบบด้วยบัญชีเดียวกับเว็บ (อีเมลหรือ Google)
6. สร้างงานได้เฉพาะคนที่อยู่ในทีม (หัวหน้าทีมเพิ่มสมาชิกในเว็บ) · แก้งานได้เฉพาะคนในงาน หัวหน้าทีม และแอดมิน (เหมือนเว็บ)

ตรวจว่าเชื่อมสำเร็จ: หน้าโปรไฟล์แสดง "เชื่อมต่อ Supabase แล้ว" · งานที่สร้างในแอปขึ้นในเว็บ · อัปเดตสถานะแล้วเห็นบรรทัด "สถานะเอกสาร" ในความเคลื่อนไหวของงานในเว็บ

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

## 3.1 ติดตั้งเป็นแอป Android (APK) และอัปเดตโดยไม่ต้องติดตั้งใหม่

ใช้ EAS Build (สร้าง APK บนคลาวด์ของ Expo) + EAS Update (ส่งโค้ดใหม่ให้แอปที่ติดตั้งแล้ว) · โปรเจกต์ EAS: `@sahatchai/irish-mobile`
- APK ต่อ Supabase ตรงผ่านอินเทอร์เน็ต ไม่ต้องเปิดคอมพิวเตอร์หรืออยู่ Wi-Fi เดียวกัน และไม่ติดปัญหา SDK ของ Expo Go
- ค่า Supabase ของ APK อยู่ใน EAS environment `preview` (ดูด้วย `npx eas-cli env:list --environment preview`) ไม่ได้อ่านจาก `.env.local`

**สร้าง APK (ทำเมื่อเริ่มต้น หรือเมื่อต้องมี APK ใหม่):**
```
npx eas-cli login
npx eas-cli build -p android --profile preview
```
รอ 10–30 นาที → เปิดลิงก์/QR ที่ได้บนมือถือ → ดาวน์โหลด → ติดตั้ง (อนุญาต "ติดตั้งแอปที่ไม่รู้จัก")

**อัปเดตหลังแก้โค้ด (หน้าจอ ข้อความ สี ลอจิก ไฟล์ .js):**
```
npx eas-cli update --channel preview --environment preview --message "อธิบายสิ่งที่แก้"
```
แอปตรวจอัปเดตตอนเปิด: เปิดครั้งแรกดาวน์โหลดเบื้องหลัง → ปิดแล้วเปิดใหม่จะเป็นเวอร์ชันใหม่

**ต้อง build APK ใหม่เมื่อ:** เพิ่มไลบรารีที่มีโค้ด native (`npx expo install` ตัวใหม่) · แก้ค่า native ใน `app.json` (ชื่อแอป ไอคอน scheme package) · อัปเกรด SDK · เปลี่ยน `version` (runtimeVersion ผูกกับ version อัปเดตจึงส่งถึงเฉพาะ APK ที่ version ตรงกัน)

Google login ในแอปที่ติดตั้ง: เด้งกลับด้วย `irishdocs://auth-callback` (Supabase Redirect URLs มี `irishdocs://**` แล้ว)

## 4. โครงสร้าง

```
App.js            ฟอนต์ · session · stack หน้า (useState) · แท็บล่าง · ข้อความแจ้งผล
theme.js          token จาก DESIGN.md (ที่เดียวที่มี hex / ตัวเลขขนาด)
data/api.js       ทางเดียวที่หน้าจอใช้คุยกับข้อมูล (Supabase หรือโหมดสาธิต)
screens/          Login · Home · Overview · Section · TaskDetail · TaskForm · Notifications · Profile
components/       Button Chip Header TaskCard StatusBadge DocRow StatusSheet ... (15 ชิ้น)
utils/            dates · docStatus (สถานะเอกสาร) · taskStatus · notifications
supabase/         schema.sql (เลิกใช้ ตารางอยู่ที่ irish-docs/drizzle)
```

**สถาปัตยกรรม:** แอป (React Native) → `@supabase/supabase-js` → Supabase Auth (JWT) + PostgreSQL (REST อัตโนมัติจาก PostgREST) → Row Level Security ตรวจสิทธิ์ทุกคำขอที่ฐานข้อมูล

## 5. ตรวจรับ (Acceptance)

ทำตาม `APP_BRIEF.md` ข้อ 8 ทั้ง 9 ข้อ · ผลทดสอบบันทึกไว้ที่ `../document_for_learn/IRISH-Project/08_Test-Report.md`
