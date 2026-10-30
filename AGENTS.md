# AGENTS.md: IRISH Docs Mobile (BOI · การพัฒนาแพลตฟอร์มดิจิทัลและ UX/UI รุ่น 2)

กฎสำหรับ AI coding tool (Codex / Claude Code) ที่ทำงานในโฟลเดอร์นี้ ดัดแปลงจาก `workshop-kit/AGENTS.md` ของ Class05

## 1. ก่อนเริ่มทุกงาน
- อ่าน `APP_BRIEF.md` (ต้องทำอะไร) และ `DESIGN.md` (ต้องหน้าตาแบบไหน) ก่อนสร้างหรือแก้ UI ทุกครั้ง
- ค่าสี ระยะ มุมโค้ง และตัวอักษร ใช้จาก `theme.js` เท่านั้น (theme.js คือสำเนาของ token ใน DESIGN.md)
- ต้องการค่าใหม่: แก้ DESIGN.md ก่อน (token + เหตุผล) → แก้ theme.js → แล้วจึงแก้หน้าจอ และบอกผู้ใช้ทุกครั้ง
- รูปต้นแบบอยู่ที่ `../irish-docs/docs/design/png/` เป็นแบบอ้างอิง ถ้าขัดกับ APP_BRIEF/DESIGN ให้ยึดเอกสาร · ห้ามดูดสีจากรูป
- ทำงานละ 1 หน้าจอหรือ 1 ฟีเจอร์ ก่อนแก้ให้ลิสต์ไฟล์ที่จะสร้างหรือแก้

## 2. Stack (ห้ามเปลี่ยน)
- Expo SDK 54 · entry `App.js` · JavaScript (`.js`) ห้าม TypeScript
- รันได้ 3 แบบ: `npx expo start` (Expo Go / web) · Expo Snack ผ่าน `snack.config.json` · APK Android ผ่าน EAS Build (`eas.json` โปรไฟล์ `preview`)
  - แก้เฉพาะ JS → ส่งให้ APK ด้วย `eas update --channel preview` · เพิ่มไลบรารี native หรือแก้ค่า native ใน `app.json` → ต้อง build APK ใหม่ และบอกผู้ใช้
- `snack.config.json` มี 4 key: `name`, `sdkVersion`, `files` (ทุกไฟล์ `.js` ยกเว้น index.js), `dependencies`
  - เพิ่มไฟล์ `.js` ใหม่ → ต้องเพิ่มใน `"files"` ทันที ไม่เช่นนั้น Snack ขึ้นจอแดง "Unable to resolve module"
  - เพิ่ม dependency → ใช้ `npx expo install <pkg>` แล้วคัดลอกเวอร์ชันไปใส่ `snack.config.json` และบอกผู้ใช้
- ห้ามใช้: expo-router หรือไลบรารีนำทาง (สลับหน้าด้วย state ใน App.js), Tailwind/NativeWind, HTML/CSS, `Alert.alert`
- ห้ามใช้รูปหรือฟอนต์ไฟล์ในเครื่อง (`require('./assets/...')`) ไอคอนใช้ `@expo/vector-icons` (Ionicons) ฟอนต์ใช้ `@expo-google-fonts/noto-sans-thai`

## 3. โครงสร้างโปรเจกต์
```
App.js                 โหลดฟอนต์ · ตรวจ session · stack ของหน้า (useState) · แถบแท็บ · ข้อความแจ้งผล
theme.js               colors, tint, spacing, radius, font, type, size, elevation, categoryStyle
data/config.js         SUPABASE_URL / SUPABASE_ANON_KEY จาก .env.local หรือแทนค่าตรง ๆ ใน Snack (ว่าง = โหมดสาธิต)
data/supabase.js       สร้าง Supabase client (เก็บ session ใน AsyncStorage)
data/api.js            ทางเดียวที่หน้าจอใช้คุยกับข้อมูล: auth + CRUD งาน + เอกสาร + สถานะ/ประวัติ + แจ้งเตือน
data/demoStore.js      ข้อมูลโหมดสาธิต (ห้ามหน้าจอ import ตรง ยกเว้น DEMO_ACCOUNT ในหน้า Login)
utils/dates.js         วันที่แบบ 'YYYY-MM-DD' และรูปแบบวันที่ไทย พ.ศ.
utils/docStatus.js     สถานะเอกสาร 5 แบบ · ขั้นถัดไป · รอใคร กี่วัน · ความคืบหน้า x/y
utils/taskStatus.js    กำหนดส่ง เลยกำหนด การเรียงงาน ชื่อย่อ
utils/notifications.js สร้างรายการแจ้งเตือนจากงาน + ประวัติ
screens/               Login (W1) · Home (W2) · Overview (W3) · Section (W4) · TaskDetail (W5) · TaskForm (W6)
                       Notifications (W8) · Profile (W9)
components/            Button Chip Header TaskCard StatusBadge DocRow ProgressBar StatusSheet (W7) CategoryIcon
                       Avatar BottomTab StateView TextField ConfirmDialog Notice
supabase/schema.sql    เลิกใช้ (30 ต.ค. 69) · ฐานข้อมูลใช้ตารางของเว็บ: migration ใน ../irish-docs/drizzle (0020 = RLS + ฟังก์ชันที่แอปเรียก)
```
- หน้าจอเรียกข้อมูลผ่าน `data/api.js` เท่านั้น · import token ด้วย `import { colors, spacing, ... } from '../theme';`

## 4. กฎการเขียน UI
- ห้ามเขียน hex/rgb หรือตัวเลขขนาด/ระยะลอย ๆ ในคอมโพเนนต์ ทุกค่าต้องมาจาก theme.js
- ข้อความบนหน้าจอเป็นภาษาไทยตาม APP_BRIEF
- ทุกปุ่มกดได้ ≥ 44×44 (ใช้ `hitSlop` ได้) และมี `accessibilityRole` + `accessibilityLabel` ภาษาไทย
- ห้าม `allowFontScaling={false}` และห้ามลด lineHeight ต่ำกว่าที่ DESIGN.md กำหนด
- ทุกหน้าที่โหลดข้อมูลต้องมี loading / error (+ "ลองใหม่") / empty ผ่าน `StateView`
- ข้อผิดพลาดแสดงเป็นข้อความบนหน้าจอ (`Notice`, `TextField error`) และการลบต้องยืนยันด้วย `ConfirmDialog`
- 1 คอมโพเนนต์ต่อไฟล์ ตั้งชื่อชัดเจน

## 5. ความปลอดภัย
- ห้ามใส่ `service_role` key รหัสผ่าน หรือข้อมูลส่วนตัวในไฟล์ใด ๆ · anon key ใส่ได้เพราะสิทธิ์คุมด้วย RLS
- Snack ที่บันทึกแล้วเปิดดูได้สาธารณะ: ถ้าจะแชร์ Snack ให้คน นอกทีม ให้คง `data/config.js` เป็นค่าว่าง (โหมดสาธิต)
- เปลี่ยนสิทธิ์การเข้าถึงข้อมูลด้วย migration ใหม่ใน `../irish-docs/drizzle` เท่านั้น (สิทธิ์ต้องตรงกับเว็บ `src/lib/auth/session.ts`) อย่าพึ่งการซ่อนปุ่มในแอป

## 6. รายงานหลังทำงาน
1. **เปลี่ยนอะไร**: ไฟล์ไหน ทำอะไร
2. **ให้กดอะไร**: ขั้นทดสอบบน web preview / Expo Go ทีละขั้น (ดู `docs/test-cases` ใน README)
3. **error**: มีหรือไม่มี ถ้ามีให้ยกข้อความมาตรง ๆ · เตือนผู้ใช้ให้ดู preview ด้วยตาเสมอ
