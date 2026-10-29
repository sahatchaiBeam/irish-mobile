import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_SUPABASE_CONFIGURED } from './config';

// สร้าง client ครั้งเดียว และเฉพาะตอนใส่ค่าใน config.js แล้ว
// session ของผู้ใช้เก็บใน AsyncStorage จึงเปิดแอปใหม่แล้วยังล็อกอินอยู่
// detectSessionInUrl บนเว็บ: กลับจากหน้า Google แล้วอ่าน session จาก URL ให้เอง (มือถืออ่านใน api.signInWithGoogle)
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;
