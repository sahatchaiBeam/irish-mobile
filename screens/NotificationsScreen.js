import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header from '../components/Header';
import StateView from '../components/StateView';
import { fetchNotifications, markNotificationsSeen } from '../data/api';

// ไอคอนและสีของแต่ละชนิดแจ้งเตือน
const KINDS = {
  returned: { icon: 'arrow-undo-outline', fg: colors.error, bg: colors.errorContainer },
  event: { icon: 'paper-plane-outline', fg: colors.primary, bg: colors.primaryContainer },
  passed: { icon: 'checkmark-circle-outline', fg: colors.success, bg: colors.successContainer },
  due: { icon: 'time-outline', fg: colors.warning, bg: colors.warningContainer },
  waiting: { icon: 'hourglass-outline', fg: colors.warning, bg: colors.warningContainer },
};

// การแจ้งเตือน (W8): ตีกลับพร้อมเหตุผล · คนอื่นอัปเดตเอกสารในงานของฉัน · ใกล้กำหนด · รอเซ็นนาน
// แตะแล้วไปที่งาน/เอกสารนั้นทันที
export default function NotificationsScreen({ user, onOpen, onChanged }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await fetchNotifications(user);
      setItems(result.items);
      setUnread(result.unread);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function open(item) {
    await markNotificationsSeen(user.id, [item.id]);
    onChanged();
    onOpen(item.taskId, item.docId);
  }

  async function readAll() {
    await markNotificationsSeen(user.id, items.map((i) => i.id));
    await load();
    onChanged();
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header
        eyebrow="IRISH DOCS"
        title="การแจ้งเตือน"
        subtitle={status === 'ready' ? (unread ? `${unread} รายการยังไม่อ่าน` : 'อ่านครบแล้ว') : ' '}
        right={
          unread ? (
            <Pressable
              onPress={readAll}
              accessibilityRole="button"
              accessibilityLabel="ทำเครื่องหมายว่าอ่านทั้งหมด"
              style={({ pressed }) => [styles.readAll, pressed && styles.readAllPressed]}
            >
              <Text style={styles.readAllText}>อ่านทั้งหมด</Text>
            </Pressable>
          ) : null
        }
      />

      {status === 'loading' ? <StateView kind="loading" message="กำลังโหลดการแจ้งเตือน…" /> : null}
      {status === 'error' ? (
        <StateView kind="error" message={`โหลดการแจ้งเตือนไม่สำเร็จ\n${error}`} actionLabel="ลองใหม่" onAction={load} />
      ) : null}

      {status === 'ready' ? (
        items.length === 0 ? (
          <StateView kind="empty" message="ไม่มีเรื่องที่ต้องรู้ตอนนี้ เอกสารเดินตามปกติ" />
        ) : (
          <View style={styles.card}>
            {items.map((item, i) => {
              const kind = KINDS[item.kind] || KINDS.event;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => open(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.unread ? 'ยังไม่อ่าน, ' : ''}${item.title}, ${item.detail}, ${item.when}`}
                  style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
                >
                  <View style={[styles.icon, { backgroundColor: kind.bg }]}>
                    <Ionicons name={kind.icon} size={size.icon} color={kind.fg} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.title, item.unread && styles.titleUnread]}>{item.title}</Text>
                    <Text style={styles.detail}>{item.detail}</Text>
                    <Text style={styles.when}>{item.when}</Text>
                  </View>
                  {item.unread ? <View style={styles.dot} /> : null}
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}
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
  readAll: {
    minHeight: size.touch,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.onPrimaryOverlay,
    justifyContent: 'center',
  },
  readAllPressed: {
    backgroundColor: colors.onPrimaryOverlayPressed,
  },
  readAllText: {
    ...type.labelMd,
    color: colors.onPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    margin: spacing.screen,
    paddingHorizontal: spacing.lg,
    ...elevation.card,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pressed: {
    backgroundColor: colors.primaryContainer,
  },
  icon: {
    width: size.touch - spacing.xs,
    height: size.touch - spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.titleMd,
    color: colors.onSurface,
  },
  titleUnread: {
    color: colors.onSurface,
    fontFamily: type.headlineLg.fontFamily,
  },
  detail: {
    ...type.bodySm,
    color: colors.muted,
  },
  when: {
    ...type.labelSm,
    color: colors.muted,
  },
  dot: {
    width: size.unreadDot,
    height: size.unreadDot,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
});
