import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Notice from '../components/Notice';
import { signIn, signUp, signInWithGoogle, validateCredentials, IS_DEMO } from '../data/api';
import { DEMO_ACCOUNT } from '../data/demoStore';

export default function LoginScreen({ onSignedIn }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState(IS_DEMO ? DEMO_ACCOUNT.email : '');
  const [password, setPassword] = useState(IS_DEMO ? DEMO_ACCOUNT.password : '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSignUp = mode === 'signup';

  async function handleGoogle() {
    setFormError('');
    setInfo('');
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) onSignedIn(user); // เว็บจะเด้งไปหน้า Google ก่อน แล้วกลับมาพร้อม session
    } catch (e) {
      setFormError(e.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit() {
    setFormError('');
    setInfo('');
    const found = validateCredentials({ name, email, password }, { isSignUp });
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp({ name, email, password });
        if (result.needsConfirm) {
          setInfo('สมัครสำเร็จ กรุณากดลิงก์ยืนยันในอีเมล แล้วกลับมาเข้าสู่ระบบ');
          setMode('signin');
        } else {
          onSignedIn(result.user);
        }
      } else {
        onSignedIn(await signIn({ email, password }));
      }
    } catch (e) {
      setFormError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isSignUp ? 'signin' : 'signup');
    setErrors({});
    setFormError('');
    setInfo('');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.decor} />
          <View style={styles.mark}>
            <Ionicons name="document-text" size={size.icon + 12} color={colors.primary} />
          </View>
          <Text style={styles.brand}>IRISH DOCS</Text>
          <Text style={styles.tagline}>งานเอกสารที่ส่งต่อได้{'\n'}รู้ว่าเอกสารอยู่ขั้นไหน รอใคร</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </Text>
          {IS_DEMO ? (
            <Notice
              tone="info"
              message={`โหมดสาธิต (ยังไม่เชื่อม Supabase) ใช้บัญชีตัวอย่าง ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password} หรืออีเมลใดก็ได้`}
            />
          ) : null}
          <Notice tone="success" message={info} />
          <Notice tone="error" message={formError} />

          {isSignUp ? (
            <TextField
              label="ชื่อ-นามสกุล"
              value={name}
              onChangeText={setName}
              placeholder="ชื่อ-นามสกุลของคุณ"
              error={errors.name}
              autoComplete="name"
            />
          ) : null}
          <TextField
            label="อีเมล"
            value={email}
            onChangeText={setEmail}
            placeholder="name@sut.ac.th"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextField
            label="รหัสผ่าน"
            value={password}
            onChangeText={setPassword}
            placeholder="อย่างน้อย 6 ตัวอักษร"
            error={errors.password}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            onSubmitEditing={handleSubmit}
          />

          <Button
            label={isSignUp ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
            onPress={handleSubmit}
            loading={loading}
            loadingLabel={isSignUp ? 'กำลังสมัคร…' : 'กำลังเข้าสู่ระบบ…'}
            disabled={googleLoading}
          />

          {IS_DEMO ? null : (
            <>
              <View style={styles.or}>
                <View style={styles.rule} />
                <Text style={styles.orText}>หรือ</Text>
                <View style={styles.rule} />
              </View>
              <Button
                label="เข้าสู่ระบบด้วย Google"
                variant="outline"
                icon="logo-google"
                onPress={handleGoogle}
                loading={googleLoading}
                loadingLabel="กำลังเปิด Google…"
                disabled={loading}
              />
            </>
          )}

          <Pressable
            onPress={switchMode}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'ไปหน้าเข้าสู่ระบบ' : 'ไปหน้าสมัครสมาชิก'}
            style={styles.switch}
            hitSlop={8}
          >
            <Text style={styles.switchText}>
              {isSignUp ? 'มีบัญชีแล้ว? ' : 'ยังไม่มีบัญชี? '}
              <Text style={styles.link}>{isSignUp ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.primary,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl * 2 + spacing.lg,
    paddingHorizontal: spacing.screen,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    width: size.decor,
    height: size.decor,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    opacity: 0.55,
    right: -size.decor / 2,
    top: -size.decor / 3,
  },
  mark: {
    width: size.fab + spacing.lg,
    height: size.fab + spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...type.headlineLg,
    color: colors.onPrimary,
  },
  tagline: {
    ...type.bodyMd,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screen,
    marginTop: -spacing.xxl * 2,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...type.headlineMd,
    color: colors.onSurface,
  },
  or: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rule: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  orText: {
    ...type.bodySm,
    color: colors.muted,
  },
  switch: {
    alignItems: 'center',
    minHeight: size.touch,
    justifyContent: 'center',
  },
  switchText: {
    ...type.bodyMd,
    color: colors.muted,
  },
  link: {
    ...type.labelLg,
    color: colors.primary,
  },
});
