import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Notice from '../components/Notice';
import { fetchTasks, signOut, IS_DEMO } from '../data/api';

// โปรไฟล์ (W9): ข้อมูลผู้ใช้ · สรุปงานและเอกสารของฉัน · สถานะการเชื่อมต่อ · ออกจากระบบ
export default function ProfileScreen({ user, onSignedOut }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetchTasks()
      .then((rows) => {
        const docs = rows.filter((t) => t.ownerId === user.id).flatMap((t) => t.documents);
        setStats({
          total: rows.filter((t) => t.ownerId === user.id).length,
          passed: docs.filter((d) => d.status === 'passed').length,
          open: docs.filter((d) => d.status !== 'passed').length,
        });
      })
      .catch((e) => setError(e.message));
  }, [user.id]);

  async function handleSignOut() {
    setSigningOut(true);
    setError('');
    try {
      await signOut();
      onSignedOut();
    } catch (e) {
      setError(e.message);
      setSigningOut(false);
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Header eyebrow="IRISH DOCS" title="โปรไฟล์" overlap />
      <View style={styles.card}>
        <Avatar name={user.name} large />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.stats}>
          {[
            { label: 'งานที่ทำ', value: stats?.total, color: colors.onSurface },
            { label: 'เอกสารผ่าน', value: stats?.passed, color: colors.success },
            { label: 'ยังค้าง', value: stats?.open, color: colors.warning },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statNumber, { color: s.color }]}>{s.value ?? '–'}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Notice tone="error" message={error} />
        <View style={styles.row}>
          <Ionicons name={IS_DEMO ? 'flask-outline' : 'cloud-done-outline'} size={size.icon} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{IS_DEMO ? 'โหมดสาธิต' : 'เชื่อมต่อ Supabase แล้ว'}</Text>
            <Text style={styles.rowText}>
              {IS_DEMO
                ? 'ข้อมูลเก็บในเครื่องชั่วคราว รีเฟรชแล้วรีเซ็ต · ใส่ค่าใน data/config.js เพื่อใช้ฐานข้อมูลจริง'
                : 'งาน เอกสาร ประวัติ และบัญชีผู้ใช้เก็บในฐานข้อมูล Supabase (PostgreSQL)'}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="information-circle-outline" size={size.icon} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>IRISH Docs Mobile · MVP v2.0</Text>
            <Text style={styles.rowText}>Expo SDK 54 · React Native · Supabase</Text>
          </View>
        </View>
        <Button label="ออกจากระบบ" icon="log-out-outline" variant="outline" onPress={handleSignOut} loading={signingOut} loadingLabel="กำลังออกจากระบบ…" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.screen,
    marginTop: -spacing.xxl * 2 + spacing.md,
    padding: spacing.xl,
    gap: spacing.xs,
    ...elevation.card,
  },
  name: {
    ...type.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  email: {
    ...type.bodySm,
    color: colors.muted,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...type.headlineLg,
  },
  statLabel: {
    ...type.bodySm,
    color: colors.muted,
  },
  section: {
    margin: spacing.screen,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rowTitle: {
    ...type.titleMd,
    color: colors.onSurface,
  },
  rowText: {
    ...type.bodySm,
    color: colors.muted,
  },
});
