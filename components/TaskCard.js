import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation, categoryStyle } from '../theme';
import CategoryIcon from './CategoryIcon';
import ProgressBar from './ProgressBar';
import { deadlineLine } from '../utils/taskStatus';
import { progressOf, countStatus } from '../utils/docStatus';

const TONE_COLOR = { error: colors.error, warning: colors.warning, muted: colors.muted, success: colors.success };

// การ์ดงาน: แถบสีหมวด · ไอคอนหมวด · ชื่อ · หมวด · กำหนดส่ง · ผ่านแล้ว x/y + แถบ · ตีกลับ/รอเซ็น
export default function TaskCard({ task, category, onPress, showOwner }) {
  const line = deadlineLine(task);
  const stripe = categoryStyle[category?.key]?.color || colors.divider;
  const { passed, total } = progressOf(task);
  const returned = countStatus(task.documents, 'returned');
  const waiting = countStatus(task.documents, 'waiting');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`งาน ${task.title}, ${line.text}, ผ่านแล้ว ${passed} จาก ${total}${returned ? `, ตีกลับ ${returned}` : ''}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <CategoryIcon categoryKey={category?.key} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category?.name ?? 'ไม่มีหมวด'}
          {showOwner ? ` · ${task.ownerName}` : ''}
        </Text>
        <View style={styles.deadline}>
          <Ionicons name="time-outline" size={size.iconSm} color={TONE_COLOR[line.tone]} />
          <Text style={[styles.deadlineText, { color: TONE_COLOR[line.tone] }]}>{line.text}</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.progressText}>
            ผ่านแล้ว <Text style={styles.progressNumber}>{passed}/{total}</Text>
          </Text>
          {returned ? (
            <Text style={[styles.flag, { color: colors.error }]}>ตีกลับ {returned}</Text>
          ) : waiting ? (
            <Text style={[styles.flag, { color: colors.warning }]}>รอเซ็น {waiting}</Text>
          ) : null}
        </View>
        <ProgressBar value={passed} total={total} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingLeft: spacing.lg + spacing.xs,
    overflow: 'hidden',
    ...elevation.card,
  },
  pressed: {
    backgroundColor: colors.primaryContainer,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: spacing.lg,
    bottom: spacing.lg,
    width: size.stripe,
    borderRadius: radius.full,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...type.titleMd,
    color: colors.onSurface,
  },
  meta: {
    ...type.bodySm,
    color: colors.muted,
  },
  deadline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  deadlineText: {
    ...type.labelMd,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressText: {
    ...type.labelSm,
    color: colors.muted,
  },
  progressNumber: {
    ...type.labelSm,
    color: colors.onSurface,
  },
  flag: {
    ...type.labelSm,
  },
});
