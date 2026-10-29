import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import TaskCard from '../components/TaskCard';
import StateView from '../components/StateView';
import { STATUS_TONES } from '../components/StatusBadge';
import { fetchTasks, fetchCategories } from '../data/api';
import { todayISO, formatThaiDate } from '../utils/dates';
import { sortTasks } from '../utils/taskStatus';
import { DOC_STATUSES, whoLine, countStatus } from '../utils/docStatus';

const SUMMARY = [
  { status: 'waiting', label: 'รอเซ็น' },
  { status: 'sent', label: 'รออนุมัติ' },
  { status: 'returned', label: 'ถูกตีกลับ' },
];

// สิ่งที่ต้องทำต่อของเอกสารแต่ละสถานะ (ตีกลับขึ้นก่อน)
const TODO = [
  { status: 'returned', action: 'แก้แล้วส่งใหม่' },
  { status: 'waiting', action: 'ตามลายเซ็น' },
  { status: 'sent', action: 'ตามผลอนุมัติ' },
];

// หน้าแรก "งานของฉัน" (W2): สรุปสถานะเอกสาร · ต้องทำต่อ · งานที่กำลังทำ พร้อมผ่านแล้ว x/y
export default function HomeScreen({ user, onOpenTask, onOpenDoc, onOpenFiltered, onOpenProfile, onCreateTask }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [taskRows, categoryRows] = await Promise.all([fetchTasks(), fetchCategories()]);
      setTasks(taskRows);
      setCategories(categoryRows);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const today = todayISO();
  const mine = useMemo(() => sortTasks(tasks.filter((t) => t.ownerId === user.id)), [tasks, user.id]);
  const myDocs = mine.flatMap((task) => task.documents.map((doc) => ({ task, doc })));
  const todo = TODO.flatMap((t) => myDocs.filter(({ doc }) => doc.status === t.status).map((pair) => ({ ...pair, action: t.action })));
  const categoryOf = (id) => categories.find((c) => c.id === id);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header
        eyebrow="IRISH DOCS"
        title="งานของฉัน"
        subtitle={`${formatThaiDate(today, { weekday: true })} · ${mine.length} งานที่กำลังทำ`}
        right={
          <Pressable onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel="เปิดโปรไฟล์" hitSlop={8}>
            <Avatar name={user.name} />
          </Pressable>
        }
        overlap
      />

      <View style={styles.summary}>
        {SUMMARY.map((item, i) => {
          const count = countStatus(myDocs.map((p) => p.doc), item.status);
          return (
            <Pressable
              key={item.status}
              onPress={() => onOpenFiltered(item.status)}
              accessibilityRole="button"
              accessibilityLabel={`${item.label} ${count} ชิ้น แตะเพื่อดูงาน`}
              style={[styles.summaryItem, i > 0 && styles.summaryDivider]}
            >
              <Text style={[styles.summaryNumber, { color: STATUS_TONES[item.status].fg }]}>{status === 'ready' ? count : '–'}</Text>
              <View style={styles.summaryLabelRow}>
                <Ionicons name={DOC_STATUSES[item.status].icon} size={size.iconSm - 4} color={colors.muted} />
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {status === 'loading' ? <StateView kind="loading" message="กำลังโหลดงาน…" /> : null}
      {status === 'error' ? (
        <StateView kind="error" message={`โหลดงานไม่สำเร็จ\n${error}`} actionLabel="ลองใหม่" onAction={load} />
      ) : null}

      {status === 'ready' ? (
        <>
          <Text style={styles.sectionTitle}>ต้องทำต่อ</Text>
          <View style={styles.list}>
            {todo.length === 0 ? (
              <Text style={styles.empty}>ไม่มีเอกสารที่ค้างอยู่กับคนอื่น</Text>
            ) : (
              todo.slice(0, 3).map(({ task, doc, action }) => {
                const tone = STATUS_TONES[doc.status];
                return (
                  <Pressable
                    key={doc.id}
                    onPress={() => onOpenDoc(task.id, doc.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${doc.name} ${action}, ${task.title}, ${whoLine(doc)}`}
                    style={({ pressed }) => [styles.todo, { borderLeftColor: tone.fg }, pressed && styles.pressed]}
                  >
                    <View style={[styles.todoIcon, { backgroundColor: tone.bg }]}>
                      <Ionicons name={DOC_STATUSES[doc.status].icon} size={size.icon} color={tone.fg} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.todoTitle}>
                        {doc.name} · {action}
                      </Text>
                      <Text style={styles.todoMeta} numberOfLines={2}>
                        {task.title} · {whoLine(doc)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={size.icon} color={colors.muted} />
                  </Pressable>
                );
              })
            )}
          </View>

          <Text style={styles.sectionTitle}>งานที่กำลังทำ</Text>
          <View style={styles.list}>
            {mine.length === 0 ? (
              <StateView kind="empty" message="ยังไม่มีงานของคุณ" actionLabel="สร้างงานจากแม่แบบ" onAction={onCreateTask} />
            ) : (
              mine.map((task) => (
                <TaskCard key={task.id} task={task} category={categoryOf(task.categoryId)} onPress={() => onOpenTask(task.id)} />
              ))
            )}
          </View>
        </>
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
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screen,
    marginTop: -spacing.xxl * 2 + spacing.md,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    ...elevation.card,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    minHeight: size.touch,
  },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  summaryNumber: {
    ...type.display,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLabel: {
    ...type.bodySm,
    color: colors.muted,
  },
  sectionTitle: {
    ...type.headlineMd,
    color: colors.onSurface,
    marginHorizontal: spacing.screen,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.gutter,
    marginHorizontal: spacing.screen,
  },
  empty: {
    ...type.bodySm,
    color: colors.muted,
  },
  todo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderLeftWidth: size.stripe,
    padding: spacing.md,
    minHeight: size.touch,
    ...elevation.card,
  },
  pressed: {
    backgroundColor: colors.primaryContainer,
  },
  todoIcon: {
    width: size.touch - spacing.xs,
    height: size.touch - spacing.xs,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoTitle: {
    ...type.titleMd,
    color: colors.onSurface,
  },
  todoMeta: {
    ...type.labelSm,
    color: colors.muted,
  },
});
