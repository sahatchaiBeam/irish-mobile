import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';

// ส่วนหัวสีน้ำเงิน IRISH + วงกลมตกแต่งมุมขวา (แทน gradient ของต้นแบบ ดู DESIGN.md › Colors)
// overlap: เผื่อพื้นที่ล่างให้การ์ดสรุปวางทับขอบส่วนหัว
export default function Header({ eyebrow, title, subtitle, onBack, backLabel = 'ย้อนกลับ', right, overlap }) {
  return (
    <View style={[styles.header, overlap && styles.overlap]}>
      <View style={styles.decorSoft} />
      <View style={styles.decor} />
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
          >
            <Ionicons name="chevron-back" size={size.icon} color={colors.onPrimary} />
          </Pressable>
        ) : null}
        {eyebrow ? <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text> : <View style={styles.flex} />}
        {right}
      </View>
      {title ? <Text style={styles.title} accessibilityRole="header">{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function HeaderIconButton({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
    >
      <Ionicons name={icon} size={size.icon} color={colors.onPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
    gap: spacing.xs,
  },
  overlap: {
    paddingBottom: spacing.xxl + spacing.xxl,
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
  decorSoft: {
    position: 'absolute',
    width: size.decor,
    height: size.decor,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    opacity: 0.5,
    right: -size.decor / 1.6,
    top: size.decor / 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: size.touch,
  },
  flex: {
    flex: 1,
  },
  iconButton: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.full,
    backgroundColor: colors.onPrimaryOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPressed: {
    backgroundColor: colors.onPrimaryOverlayPressed,
  },
  eyebrow: {
    ...type.labelMd,
    color: colors.onPrimary,
    flex: 1,
  },
  title: {
    ...type.headlineLg,
    color: colors.onPrimary,
  },
  subtitle: {
    ...type.bodySm,
    color: colors.onPrimary,
  },
});
