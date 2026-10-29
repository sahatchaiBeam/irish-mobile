import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';
import { DOC_STATUSES } from '../utils/docStatus';

// ป้ายสถานะเอกสาร: draft | waiting | sent | returned | passed
// มีไอคอนและข้อความเสมอ ไม่ใช้สีอย่างเดียวบอกความหมาย (DESIGN.md › Colors)
export const STATUS_TONES = {
  draft: { bg: colors.divider, fg: colors.muted },
  waiting: { bg: colors.warningContainer, fg: colors.warning },
  sent: { bg: colors.primaryContainer, fg: colors.primary },
  returned: { bg: colors.errorContainer, fg: colors.error },
  passed: { bg: colors.successContainer, fg: colors.success },
};

// count: แสดงตัวเลขต่อท้าย เช่น "รอเซ็น 2" (ใช้ในหน้าภาพรวม)
export default function StatusBadge({ status, count, label }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.draft;
  const text = `${label ?? DOC_STATUSES[status]?.label ?? status}${count != null ? ` ${count}` : ''}`;
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]} accessibilityLabel={`สถานะ ${text}`}>
      <Ionicons name={DOC_STATUSES[status]?.icon || 'ellipse-outline'} size={size.iconSm - 4} color={tone.fg} />
      <Text style={[styles.label, { color: tone.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  label: {
    ...type.labelSm,
  },
});
