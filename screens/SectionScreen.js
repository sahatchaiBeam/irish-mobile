import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';
import Header, { HeaderIconButton } from '../components/Header';
import TaskCard from '../components/TaskCard';
import Chip from '../components/Chip';
import StateView from '../components/StateView';
import { fetchTasks, fetchCategories } from '../data/api';
import { sortTasks } from '../utils/taskStatus';
import { isTaskComplete } from '../utils/docStatus';

const FILTERS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'waiting', label: 'มีเอกสารรอเซ็น' },
  { key: 'returned', label: 'ถูกตีกลับ' },
  { key: 'sent', label: 'รออนุมัติ' },
  { key: 'complete', label: 'ผ่านครบ' },
];

// งานในส่วน (W4): งานทั้งแล็บในส่วนนั้น (category = null คือทุกส่วน) + ค้นหา + กรองตามสถานะเอกสาร
export default function SectionScreen({ category, initialFilter = 'all', onBack, onOpenTask, onCreateTask }) {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(initialFilter);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [rows, cats] = await Promise.all([fetchTasks(), fetchCategories()]);
      setTasks(category ? rows.filter((t) => t.categoryId === category.id) : rows);
      setCategories(cats);
      setStatus('ready');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const visible = sortTasks(
    tasks.filter((t) => {
      const matchText =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.recipient.toLowerCase().includes(q) ||
        t.accountOwner.toLowerCase().includes(q) ||
        t.documents.some((d) => d.name.toLowerCase().includes(q));
      const matchStatus =
        filter === 'all' ||
        (filter === 'complete' ? isTaskComplete(t) : t.documents.some((d) => d.status === filter));
      return matchText && matchStatus;
    }),
  );
  const categoryOf = (id) => categories.find((c) => c.id === id);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Header
        eyebrow="ภาพรวม"
        title={category ? category.name : 'งานทุกส่วน'}
        subtitle={category ? category.description : 'งานทั้งแล็บ กรองตามสถานะเอกสาร'}
        onBack={onBack}
        right={
          category ? (
            <HeaderIconButton icon="add" label={`สร้างงานในส่วน ${category.name}`} onPress={() => onCreateTask(category.id)} />
          ) : null
        }
      />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={size.icon} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาชื่องาน เอกสาร หรือผู้เซ็น"
          placeholderTextColor={colors.outline}
          accessibilityLabel="ค้นหางาน"
          style={styles.search}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {status === 'loading' ? <StateView kind="loading" message="กำลังโหลดงาน…" /> : null}
      {status === 'error' ? (
        <StateView kind="error" message={`โหลดงานไม่สำเร็จ\n${error}`} actionLabel="ลองใหม่" onAction={load} />
      ) : null}
      {status === 'ready' ? (
        <View style={styles.list}>
          <Text style={styles.count}>
            พบ {visible.length} จาก {tasks.length} งาน
          </Text>
          {visible.length === 0 ? (
            <StateView
              kind="empty"
              message={tasks.length === 0 ? 'ส่วนนี้ยังไม่มีงาน' : 'ไม่มีงานที่ตรงกับตัวกรอง ลองเลือก "ทั้งหมด"'}
              actionLabel={tasks.length === 0 && category ? 'สร้างงานในส่วนนี้' : undefined}
              onAction={() => onCreateTask(category?.id)}
            />
          ) : (
            visible.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                category={categoryOf(task.categoryId)}
                showOwner
                onPress={() => onOpenTask(task.id)}
              />
            ))
          )}
        </View>
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.outline,
    marginHorizontal: spacing.screen,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: size.input,
  },
  search: {
    ...type.bodyMd,
    flex: 1,
    color: colors.onSurface,
    minHeight: size.touch,
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
  },
  list: {
    gap: spacing.gutter,
    marginHorizontal: spacing.screen,
  },
  count: {
    ...type.bodySm,
    color: colors.muted,
  },
});
