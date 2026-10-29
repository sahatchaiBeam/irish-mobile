// ค่าเชื่อมต่อ Supabase (ดูวิธีหาค่าใน README.md ข้อ 2)
// Supabase › Project Settings › API › Project URL และ anon public key
//
// - anon key เป็นค่าที่ออกแบบให้อยู่ในแอปได้ (สิทธิ์จริงคุมด้วย Row Level Security ใน supabase/schema.sql)
// - ห้ามใส่ service_role key ในไฟล์นี้เด็ดขาด เพราะ Snack ที่บันทึกแล้วเปิดดูได้แบบสาธารณะ
// - ถ้ายังไม่ได้ใส่ค่า แอปจะทำงานใน "โหมดสาธิต" (ข้อมูลอยู่ในเครื่อง รีเฟรชแล้วรีเซ็ต)
// - รันในเครื่อง (npx expo start): ใส่ค่าในไฟล์ .env.local (ไม่ขึ้น Git) ตามตัวอย่าง .env.example
// - Expo Snack อ่าน .env ไม่ได้: แทนค่า 'https://YOUR-PROJECT-ID...' และ 'YOUR-ANON-KEY' ด้านล่างตรง ๆ
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR-PROJECT-ID.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR-ANON-KEY';

export const IS_SUPABASE_CONFIGURED =
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('YOUR-PROJECT-ID') &&
  SUPABASE_ANON_KEY.length > 20;
