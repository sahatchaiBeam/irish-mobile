import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';
import StatusBadge from './StatusBadge';
import { whoLine } from '../utils/docStatus';

// แถวเอกสารที่ต้องมี: วงกลมถูก (ผ่าน) · ชื่อ (+ กุญแจ) · รอใคร กี่วัน / เหตุผลที่ตีกลับ · ป้ายสถานะ
export default function DocRow({ doc, onPress, first }) {
  const passed = doc.status === 'passed';
  const line = whoLine(doc);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${doc.name}${doc.personal ? ' มีข้อมูลส่วนบุคคล' : ''}, ${line}, แตะเพื่ออัปเดตสถานะ`}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.check, passed && styles.checkOn]}>
        {passed ? <Ionicons name="checkmark" size={size.iconSm - 2} color={colors.onPrimary} /> : null}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{doc.name}</Text>
          {doc.personal ? <Ionicons name="lock-closed" size={size.iconSm - 4} color={colors.muted} accessibilityLabel="ข้อมูลส่วนบุคคล" /> : null}
        </View>
        <Text style={[styles.line, doc.status === 'returned' && styles.lineReturned]}>{line}</Text>
      </View>
      <StatusBadge status={doc.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: size.touch,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pressed: {
    backgroundColor: colors.primaryContainer,
  },
  check: {
    width: size.icon + 2,
    height: size.icon + 2,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  name: {
    ...type.titleMd,
    color: colors.onSurface,
    flexShrink: 1,
  },
  line: {
    ...type.labelSm,
    color: colors.muted,
  },
  lineReturned: {
    color: colors.error,
  },
});
