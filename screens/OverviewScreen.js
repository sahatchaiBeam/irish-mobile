import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header from '../components/Header';
import CategoryIcon from '../components/CategoryIcon';
import StatusBadge from '../components/StatusBadge';
import StateView from '../components/StateView';
import { fetchTasks, fetchCategories } from '../data/api';
import { DOC_STATUSES, countStatus, longestStuck, daysInStatus, whoLine } from '../utils/docStatus';

// ภาพรวมแต่ละส่วน (W3) สำหรับอาจารย์ผู้ติดตาม: ส่วนไหนติด ติดที่ใคร กี่วัน โดยไม่ต้องถามทีละคน
// เรียงส่วนที่มีเอกสารค้างนานที่สุดขึ้นก่อน
export default function OverviewScreen({ onOpenSection }) {
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [tasks, categories] = await Promise.all([fetchTasks(), fetchCategories()]);
      const rows = categories.map((category) => {
        const inSection = tasks.filter((t) => t.categoryId === category.id);
        const pairs = inSection.flatMap((task) => task.documents.map((doc) => ({ task, doc })));
        const stuck = longestStuck(pairs);
        return {
          category,
          taskCount: inSection.length,
          docs: pairs.map((p) => p.doc),
          stuck,
          score: stuck ? daysInStatus(stuck.doc) : -1,
        };
      });
      setSections(rows.sort((a, b) => b.score - a.score));
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

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header eyebrow="IRISH DOCS" title="ภาพรวมแต่ละส่วน" subtitle="ส่วนไหนติด ติดที่ใคร โดยไม่ต้องถามทีละคน" />

      {status === 'loading' ? <StateView kind="loading" message="กำลังโหลดภาพรวม…" /> : null}
      {status === 'error' ? (
        <StateView kind="error" message={`โหลดข้อมูลไม่สำเร็จ\n${error}`} actionLabel="ลองใหม่" onAction={load} />
      ) : null}

      {status === 'ready' ? (
        <View style={styles.list}>
          {sections.map(({ category, taskCount, docs, stuck }) => {
            const waiting = countStatus(docs, 'waiting');
            const sent = countStatus(docs, 'sent');
            const returned = countStatus(docs, 'returned');
            const clear = !waiting && !sent && !returned;
            return (
              <Pressable
                key={category.id}
                onPress={() => onOpenSection(category)}
                accessibilityRole="button"
                accessibilityLabel={`${category.name} กำลังทำ ${taskCount} งาน${stuck ? `, ติดนานสุด ${stuck.doc.name} ${whoLine(stuck.doc)}` : ', ไม่มีเอกสารค้าง'}`}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.top}>
                  <CategoryIcon categoryKey={category.key} />
                  <Text style={styles.name}>{category.name}</Text>
                  <Ionicons name="chevron-forward" size={size.icon} color={colors.muted} />
                </View>
                <View style={styles.badges}>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>กำลังทำ {taskCount}</Text>
                  </View>
                  {waiting ? <StatusBadge status="waiting" count={waiting} /> : null}
                  {sent ? <StatusBadge status="sent" count={sent} label="รออนุมัติ" /> : null}
                  {returned ? <StatusBadge status="returned" count={returned} /> : null}
                  {clear && taskCount ? <StatusBadge status="passed" label="ไม่มีเอกสารค้าง" /> : null}
                </View>
                {stuck ? (
                  <View style={styles.stuck}>
                    <Ionicons name={DOC_STATUSES[stuck.doc.status].icon} size={size.iconSm} color={colors.muted} />
                    <View style={styles.flex}>
                      <Text style={styles.stuckTitle}>
                        ติดนานสุด: <Text style={styles.stuckDoc}>{stuck.doc.name}</Text>
                      </Text>
                      <Text style={styles.stuckMeta}>
                        {whoLine(stuck.doc)} · {stuck.task.title}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
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
  list: {
    gap: spacing.gutter,
    margin: spacing.screen,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.card,
  },
  pressed: {
    backgroundColor: colors.primaryContainer,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  name: {
    ...type.titleMd,
    color: colors.onSurface,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  countText: {
    ...type.labelSm,
    color: colors.muted,
  },
  stuck: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stuckTitle: {
    ...type.bodySm,
    color: colors.onSurface,
  },
  stuckDoc: {
    ...type.labelMd,
    color: colors.onSurface,
  },
  stuckMeta: {
    ...type.labelSm,
    color: colors.muted,
  },
});
