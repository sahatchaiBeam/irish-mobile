// theme.js = สำเนาของ token ใน DESIGN.md (ที่เดียวในโปรเจกต์ที่มี hex และตัวเลขขนาด/ระยะ)
// ชื่อ kebab-case ใน DESIGN.md → camelCase ที่นี่ เช่น primary-pressed → colors.primaryPressed
// ถ้าต้องการค่าใหม่: แก้ DESIGN.md ก่อน แล้วจึงแก้ไฟล์นี้

// DESIGN.md › colors
export const colors = {
  primary: '#155EEF',
  primaryPressed: '#0F47B8',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EAF2FF',
  accent: '#39BFEA', // ตกแต่งเท่านั้น
  accentSoft: '#5BD6B0', // ตกแต่งเท่านั้น
  background: '#F5F8FF',
  surface: '#FFFFFF',
  onSurface: '#172B4D',
  muted: '#44546F',
  outline: '#8590A2',
  divider: '#D8E0EC',
  disabled: '#D8E0EC',
  onDisabled: '#44546F',
  success: '#16794A',
  successContainer: '#E7F5ED',
  warning: '#805600',
  warningContainer: '#FFF3D7',
  error: '#B42318',
  errorContainer: '#FFECEB',
  catProcurement: '#155EEF',
  catCoordination: '#16794A',
  catVenue: '#B25E09',
  catTraining: '#6741D9',
  scrim: 'rgba(23, 43, 77, 0.45)', // พื้นหลังโปร่งของกล่องยืนยัน (on-surface 45%)
  onPrimaryOverlay: 'rgba(255, 255, 255, 0.18)', // ปุ่มไอคอนบนส่วนหัว
  onPrimaryOverlayPressed: 'rgba(255, 255, 255, 0.32)',
};

// พื้นอ่อนของสีหมวด (สีหมวด + ความทึบ 12% ตาม DESIGN.md › Colors)
export const tint = (hex) => `${hex}1F`;

// DESIGN.md › spacing (1px = 1 dp)
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 20,
  gutter: 12,
};

// DESIGN.md › rounded
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 20,
  sheet: 28, // มุมบนของแผ่นเลื่อนขึ้น (อัปเดตสถานะ)
  full: 9999,
};

// DESIGN.md › typography (lineHeight = 1.5 เท่าของ fontSize)
// น้ำหนักตัวอักษรเลือกด้วย fontFamily ของ Noto Sans Thai (ไม่ใส่ fontWeight)
export const font = {
  regular: 'NotoSansThai_400Regular',
  medium: 'NotoSansThai_500Medium',
  semiBold: 'NotoSansThai_600SemiBold',
  bold: 'NotoSansThai_700Bold',
};

export const type = {
  display: { fontFamily: font.bold, fontSize: 28, lineHeight: 42 },
  headlineLg: { fontFamily: font.bold, fontSize: 24, lineHeight: 36 },
  headlineMd: { fontFamily: font.semiBold, fontSize: 20, lineHeight: 30 },
  titleMd: { fontFamily: font.semiBold, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: font.regular, fontSize: 14, lineHeight: 21 },
  labelLg: { fontFamily: font.semiBold, fontSize: 16, lineHeight: 24 },
  labelMd: { fontFamily: font.medium, fontSize: 14, lineHeight: 21 },
  labelSm: { fontFamily: font.medium, fontSize: 12, lineHeight: 18 },
};

// DESIGN.md › components (height / size)
export const size = {
  button: 52,
  buttonTall: 68, // ปุ่มใหญ่ขั้นถัดไปในแผ่นอัปเดตสถานะ
  input: 52,
  chip: 44,
  tabBar: 72,
  fab: 60,
  touch: 44,
  icon: 24,
  iconSm: 18,
  categoryIcon: 48,
  avatar: 32,
  stepDot: 32, // จุดขั้นตอนในแผ่นอัปเดตสถานะ
  unreadDot: 10,
  progress: 6, // แถบความคืบหน้า ผ่านแล้ว x/y
  stripe: 4,
  decor: 220, // วงกลมตกแต่งมุมขวาของส่วนหัว
  maxWidth: 480, // ความกว้างสูงสุดของแอปบนจอเว็บ (web preview ของ Snack)
};

// DESIGN.md › Elevation & Depth
export const elevation = {
  card: {
    shadowColor: '#172B4D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fab: {
    shadowColor: '#155EEF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
};

// สีและไอคอนประจำหมวด (key ตรงกับคอลัมน์ categories.key ใน Supabase)
export const categoryStyle = {
  procurement: { color: colors.catProcurement, icon: 'cart-outline' },
  coordination: { color: colors.catCoordination, icon: 'people-outline' },
  venue: { color: colors.catVenue, icon: 'business-outline' },
  training: { color: colors.catTraining, icon: 'school-outline' },
};
