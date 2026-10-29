---
version: alpha
name: IRISH Docs Mobile
description: แอปมือถือติดตามงานเอกสารของ IRiSH Lab (Expo / React Native + Supabase) สะอาด น่าเชื่อถือ เห็นว่าเอกสารอยู่ขั้นไหน รอใคร กี่วัน กดง่ายด้วยมือเดียว
colors:
  primary: "#155EEF"            # IRISH Blue: ปุ่มหลัก แท็บที่เลือก ลิงก์ ส่วนหัว (ตัวขาว 5.41:1)
  primary-pressed: "#0F47B8"    # ปุ่มหลักตอนกดค้าง (ตัวขาว 8.1:1)
  on-primary: "#FFFFFF"
  primary-container: "#EAF2FF"  # พื้นป้าย "ส่งแล้ว" พื้นไอคอนหมวดจัดซื้อ
  accent: "#39BFEA"             # คลื่นตกแต่งมุมขวาของส่วนหัว: ตกแต่งเท่านั้น ห้ามใช้เป็นพื้นของข้อความ
  accent-soft: "#5BD6B0"        # คลื่นตกแต่งชั้นที่สอง
  background: "#F5F8FF"         # พื้นทุกหน้า
  surface: "#FFFFFF"            # การ์ด ช่องกรอก แถบแท็บ
  on-surface: "#172B4D"         # ตัวอักษรหลัก (13.9:1 บนพื้น)
  muted: "#44546F"              # ข้อความรอง (7.6:1 บนการ์ดขาว)
  outline: "#8590A2"            # ขอบช่องกรอก / ปุ่มขอบ (3.3:1 ตาม WCAG 1.4.11)
  divider: "#D8E0EC"            # เส้นคั่นตกแต่ง ชิปที่ไม่ได้เลือก
  disabled: "#D8E0EC"
  on-disabled: "#44546F"
  success: "#16794A"            # สถานะเอกสาร "ผ่าน"
  success-container: "#E7F5ED"
  warning: "#805600"            # สถานะเอกสาร "รอเซ็น" และ "ใกล้กำหนด"
  warning-container: "#FFF3D7"
  error: "#B42318"              # สถานะเอกสาร "ตีกลับ" · "เลยกำหนด" · ข้อความผิดพลาด (เดิม #C9372C ได้แค่ 4.5:1 บนพื้นชมพู)
  error-container: "#FFECEB"
  cat-procurement: "#155EEF"    # สีประจำหมวด: จัดซื้อจัดจ้าง
  cat-coordination: "#16794A"   # ประสานงาน
  cat-venue: "#B25E09"          # สถานที่ (เดิม #D97706 ได้ 3.2:1 จึงเข้มขึ้นให้ใช้กับข้อความได้)
  cat-training: "#6741D9"       # อบรม
  scrim: "#172B4D73"            # พื้นโปร่งหลังกล่องยืนยัน (on-surface 45%)
  on-primary-overlay: "#FFFFFF2E"         # ปุ่มไอคอนบนส่วนหัว (ขาว 18%)
  on-primary-overlay-pressed: "#FFFFFF52" # ตอนกดค้าง (ขาว 32%)
typography:
  display:     { fontFamily: Noto Sans Thai, fontSize: 28px, fontWeight: 700, lineHeight: 42px }
  headline-lg: { fontFamily: Noto Sans Thai, fontSize: 24px, fontWeight: 700, lineHeight: 36px }
  headline-md: { fontFamily: Noto Sans Thai, fontSize: 20px, fontWeight: 600, lineHeight: 30px }
  title-md:    { fontFamily: Noto Sans Thai, fontSize: 16px, fontWeight: 600, lineHeight: 24px }
  body-md:     { fontFamily: Noto Sans Thai, fontSize: 16px, fontWeight: 400, lineHeight: 24px }
  body-sm:     { fontFamily: Noto Sans Thai, fontSize: 14px, fontWeight: 400, lineHeight: 21px }
  label-lg:    { fontFamily: Noto Sans Thai, fontSize: 16px, fontWeight: 600, lineHeight: 24px }
  label-md:    { fontFamily: Noto Sans Thai, fontSize: 14px, fontWeight: 500, lineHeight: 21px }
  label-sm:    { fontFamily: Noto Sans Thai, fontSize: 12px, fontWeight: 500, lineHeight: 18px }
spacing: { xxs: 2px, xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, xxl: 32px, screen: 20px, gutter: 12px }
rounded: { sm: 8px, md: 12px, lg: 18px, xl: 20px, sheet: 28px, full: 9999px }
components:
  screen:            { backgroundColor: "{colors.background}", textColor: "{colors.on-surface}", padding: "{spacing.screen}" }
  header:            { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.headline-lg}", padding: "{spacing.screen}" }
  button-primary:    { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label-lg}", rounded: "{rounded.xl}", height: 52px }
  button-primary-pressed:  { backgroundColor: "{colors.primary-pressed}", textColor: "{colors.on-primary}" }
  button-primary-disabled: { backgroundColor: "{colors.disabled}", textColor: "{colors.on-disabled}" }
  button-outline:    { backgroundColor: "{colors.surface}", textColor: "{colors.primary}", typography: "{typography.label-lg}", rounded: "{rounded.xl}", height: 52px }
  button-danger:     { backgroundColor: "{colors.error-container}", textColor: "{colors.error}", typography: "{typography.label-lg}", rounded: "{rounded.xl}", height: 52px }
  card:              { backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", rounded: "{rounded.lg}", padding: "{spacing.lg}" }
  task-card-stripe:  { width: 4px, rounded: "{rounded.full}" }
  category-icon:     { rounded: "{rounded.md}", size: 48px }
  avatar:            { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label-sm}", rounded: "{rounded.full}", size: 32px }
  input:             { backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body-md}", rounded: "{rounded.md}", height: 52px, padding: "{spacing.lg}" }
  input-error:       { backgroundColor: "{colors.surface}", textColor: "{colors.error}", typography: "{typography.body-sm}" }
  chip:              { backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.label-md}", rounded: "{rounded.full}", height: 44px, padding: "{spacing.lg}" }
  chip-selected:     { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}" }
  badge-draft:       { backgroundColor: "{colors.divider}", textColor: "{colors.muted}", typography: "{typography.label-sm}", rounded: "{rounded.full}" }
  badge-waiting:     { backgroundColor: "{colors.warning-container}", textColor: "{colors.warning}", typography: "{typography.label-sm}", rounded: "{rounded.full}" }
  badge-sent:        { backgroundColor: "{colors.primary-container}", textColor: "{colors.primary}", typography: "{typography.label-sm}", rounded: "{rounded.full}" }
  badge-returned:    { backgroundColor: "{colors.error-container}", textColor: "{colors.error}", typography: "{typography.label-sm}", rounded: "{rounded.full}" }
  badge-passed:      { backgroundColor: "{colors.success-container}", textColor: "{colors.success}", typography: "{typography.label-sm}", rounded: "{rounded.full}" }
  button-tall:       { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.label-lg}", rounded: "{rounded.xl}", height: 68px }
  sheet:             { backgroundColor: "{colors.surface}", rounded: "{rounded.sheet}", padding: "{spacing.screen}" }
  step-dot:          { rounded: "{rounded.full}", size: 32px }
  progress-bar:      { backgroundColor: "{colors.divider}", textColor: "{colors.success}", rounded: "{rounded.full}", height: 6px }
  tab-bar:           { backgroundColor: "{colors.surface}", height: 72px }
  tab-item-active:   { textColor: "{colors.primary}", typography: "{typography.label-sm}" }
  tab-item-inactive: { textColor: "{colors.muted}", typography: "{typography.label-sm}" }
  fab:               { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.full}", size: 60px }
  unread-dot:        { backgroundColor: "{colors.primary}", rounded: "{rounded.full}", size: 10px }
---

## Overview

IRISH Docs คือแอปมือถือของ IRiSH Lab สำหรับคนที่รับงานเอกสารต่อจากคนเก่า ทุกงานตอบได้ 3 ข้อ: **ใช้เอกสารอะไร · ส่งให้ใคร · เอกสารอยู่ขั้นไหน (รอใคร กี่วัน)**
ภาพที่ต้องการ: **แฟ้มงานสีขาวสะอาดบนโต๊ะสีฟ้าอ่อน** ส่วนหัวสีน้ำเงิน IRISH พร้อมคลื่นสีฟ้าอมเขียวที่มุมขวา เหมือนหน้าจอต้นแบบใน `irish-docs/docs/design/png/`
ข้อมูลที่ต้องเด่นที่สุดคือ **สถานะเอกสาร** ผู้ใช้ต้องรู้ภายใน 3 วินาทีว่ามีเอกสารรอเซ็น รออนุมัติ หรือถูกตีกลับกี่ชิ้น

## Colors

- ที่มา: Design System ใน `irish-docs/docs/02_ออกแบบระบบ_System-Design.md` ข้อ 9 และ `irish-docs/src/theme/tokens.css`
- {colors.primary} ใช้กับปุ่มหลัก แท็บที่เลือก ลิงก์ และพื้นส่วนหัว (ต่อหนึ่งหน้าจอมีปุ่มหลักแบบเต็มได้ 1 ปุ่ม)
- ต้นแบบใช้ gradient `#155EEF → #39BFEA` ที่ส่วนหัว ในแอปเปลี่ยนเป็นพื้นสีเดียว {colors.primary} + วงกลมตกแต่ง {colors.accent} / {colors.accent-soft} ที่มุมขวา เพื่อไม่ต้องเพิ่มไลบรารี gradient และตัวอักษรขาวบนพื้นได้ ≥ 4.5:1 ทุกจุด
- **สีสถานะต้องมาพร้อมข้อความและไอคอนเสมอ** (เช่น ป้าย "ตีกลับ") ห้ามใช้สีอย่างเดียวบอกความหมาย
- สถานะเอกสาร 5 แบบใช้ป้ายสีเดิมของแอป: เตรียม {colors.divider}/{colors.muted} · รอเซ็น {colors.warning-container}/{colors.warning} · ส่งแล้ว {colors.primary-container}/{colors.primary} · ตีกลับ {colors.error-container}/{colors.error} · ผ่าน {colors.success-container}/{colors.success}
- แก้สีจากต้นแบบ 2 จุดเพื่อผ่าน WCAG AA: error `#C9372C → #B42318` และสีหมวดสถานที่ `#D97706 → #B25E09`
- สีประจำหมวดใช้กับไอคอนหมวดและแถบสีซ้ายของการ์ดงาน วางบนพื้นสีอ่อนของหมวดนั้น (ความทึบ 12%)

## Typography

ใช้ **Noto Sans Thai** ทั้งแอป (ตรงกับต้นแบบ) โหลดจาก `@expo-google-fonts/noto-sans-thai`
- lineHeight = 1.5 เท่าของ fontSize เพราะภาษาไทยมีสระบน-ล่างและวรรณยุกต์ซ้อน
- เนื้อความ 16 · รายละเอียด 14 · ขนาดเล็กสุด 12 ใช้กับแท็บ ป้ายสถานะ และ avatar เท่านั้น
- ประโยคทดสอบตัวอักษรถูกตัด: "ปั๊มน้ำ ญี่ปุ่น ฎีกา ฤๅษี กำหนดส่ง 11 ต.ค. 2569"
- ถ้าโหลดฟอนต์ไม่ได้ ให้ใช้ฟอนต์ระบบต่อ โดยคง fontSize และ lineHeight เดิม

## Layout

- ตารางฐาน 4 · ระยะขอบจอ {spacing.screen} · ระยะระหว่างการ์ด {spacing.gutter} · ระยะในการ์ด {spacing.lg}
- เฟรมอ้างอิง 390×844 (iPhone 14/15) คอลัมน์เดียวทุกหน้า
- ส่วนหัวสีน้ำเงินสูงพอวางชื่อหน้า 1–2 บรรทัด การ์ดสรุปวางทับขอบล่างของส่วนหัว (เหมือนต้นแบบ)
- ปุ่มหลักวางชิดล่าง (ใกล้นิ้วโป้ง) เผื่อ safe area เสมอ เนื้อหายาวให้เลื่อนได้
- แถบแท็บล่างมีเฉพาะหน้า หน้าแรก / ภาพรวม / แจ้งเตือน / โปรไฟล์ และมีปุ่ม + ตรงกลางสำหรับสร้างงาน
- การอัปเดตสถานะเอกสารเป็นแผ่นเลื่อนขึ้นจากล่าง (sheet) ทับหน้ารายละเอียดงาน ปุ่มใหญ่ปุ่มเดียวอยู่ในโซนนิ้วโป้ง

## Elevation & Depth

การ์ดสีขาวบนพื้นฟ้าอ่อนใช้เงาอ่อนระดับเดียว (iOS: shadowOpacity 0.06, shadowRadius 12 / Android: elevation 2) ปุ่ม + กลางใช้เงาเข้มขึ้นเล็กน้อย (elevation 4) ห้ามใช้เงาหลายชั้นหรือ glassmorphism

## Shapes

การ์ด {rounded.lg} 18 · ปุ่มหลัก {rounded.xl} 20 · ช่องกรอกและไอคอนหมวด {rounded.md} · แผ่นเลื่อนขึ้น {rounded.sheet} 28 (มุมบน) · ชิป ป้าย และจุดขั้นตอนเป็น pill {rounded.full}

## Components

- **TaskCard**: แถบสีหมวดด้านซ้าย 4 · ไอคอนหมวด 48 · ชื่องาน (title-md, ไม่เกิน 2 บรรทัด) · "หมวด · ครบ วันที่ (อีก n วัน)" · "ผ่านแล้ว x/y" + แถบความคืบหน้า {colors.success} · จำนวนตีกลับ/รอเซ็น
- **StatusBadge** (สถานะเอกสาร): เตรียม / รอเซ็น / ส่งแล้ว / ตีกลับ / ผ่าน มีไอคอนประจำสถานะทุกป้าย
- **DocRow**: วงกลมถูก (ผ่าน) · ชื่อเอกสาร (+ กุญแจถ้ามีข้อมูลส่วนบุคคล) · "รอใคร · กี่วัน" หรือเหตุผลที่ตีกลับ · ป้ายสถานะ
- **StatusSheet** (อัปเดตสถานะ): แถบขั้นตอน 4 จุด (เตรียม → รอเซ็น → ส่งปลายทาง → ผ่าน) · ปุ่มใหญ่ button-tall สำหรับขั้นถัดไปปุ่มเดียว · รอใคร (ใส่ให้อัตโนมัติ) · หมายเหตุ · "ถูกตีกลับ… ระบุเหตุผล" เป็นปุ่ม danger แยกด้านล่าง
- **Button**: primary / outline / danger สูง 52 · ระหว่างบันทึกแสดงข้อความ "กำลังบันทึก…" และปิดปุ่มกันกดซ้ำ
- **Input**: label อยู่เหนือช่องเสมอ (placeholder ไม่ใช่ label) · ผิดพลาดแสดง input-error ใต้ช่อง
- **Chip**: สูง 44 ใช้กรองสถานะ เลือกแม่แบบ เลือกหมวด เลือกกำหนดส่งด่วน เลือกเหตุผลที่ตีกลับ
- **StateView**: loading / error (+ ปุ่ม "ลองใหม่") / empty ทุกหน้าที่โหลดข้อมูล
- **BottomTab**: หน้าแรก · ภาพรวม · (+) · แจ้งเตือน (ตัวเลขยังไม่อ่าน) · โปรไฟล์ ไอคอน Ionicons 24 + ข้อความเสมอ

## Do's and Don'ts

- Do ใช้ค่าจากไฟล์นี้ผ่าน `theme.js` เท่านั้น ถ้าต้องการค่าใหม่ให้แก้ไฟล์นี้ก่อน
- Do ให้ข้อความทุกคู่สีได้ ≥ 4.5:1 และไอคอนหรือขอบที่ต้องมองเห็นได้ ≥ 3:1
- Do พื้นที่กด ≥ 44×44 และใส่ accessibilityRole + accessibilityLabel ภาษาไทยทุกปุ่ม
- Do แจ้งผลและข้อผิดพลาดเป็นข้อความบนหน้าจอ (ห้าม `Alert.alert` เพราะใช้บนเว็บของ Snack ไม่ได้)
- Don't ใช้ {colors.accent} เป็นพื้นของข้อความ · Don't ใช้ `allowFontScaling={false}` · Don't ใช้ hover

## React Native / Snack notes

- 1px ในไฟล์นี้ = 1 dp · `theme.js` สะท้อน token: `colors` ← colors · `spacing` ← spacing · `radius` ← rounded · `type` ← typography · `size` ← height/size ใน components · `elevation` ← Elevation & Depth
- kebab-case → camelCase เช่น `primary-pressed` → `colors.primaryPressed`, `label-lg` → `type.labelLg`, `cat-venue` → `colors.catVenue`
- น้ำหนักฟอนต์เลือกด้วย fontFamily: 400 `NotoSansThai_400Regular` · 500 `NotoSansThai_500Medium` · 600 `NotoSansThai_600SemiBold` · 700 `NotoSansThai_700Bold` (ไม่ใส่ fontWeight)
