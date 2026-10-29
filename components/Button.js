import React from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';

// variant: 'primary' | 'outline' | 'danger'
// loadingLabel: ข้อความระหว่างรอ เช่น "กำลังบันทึก…" (ปุ่มจะปิดตัวเองกันกดซ้ำ)
export default function Button({ label, onPress, variant = 'primary', icon, disabled, loading, loadingLabel, accessibilityLabel }) {
  const inactive = disabled || loading;
  const palette = PALETTES[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && !inactive && { backgroundColor: palette.pressed },
        inactive && variant === 'primary' && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={inactive && variant === 'primary' ? colors.onDisabled : palette.text} />
        ) : icon ? (
          <Ionicons name={icon} size={size.icon} color={inactive && variant === 'primary' ? colors.onDisabled : palette.text} />
        ) : null}
        <Text style={[styles.label, { color: inactive && variant === 'primary' ? colors.onDisabled : palette.text }]}>
          {loading && loadingLabel ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

const PALETTES = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary, border: colors.primary },
  outline: { bg: colors.surface, pressed: colors.primaryContainer, text: colors.primary, border: colors.outline },
  danger: { bg: colors.errorContainer, pressed: colors.errorContainer, text: colors.error, border: colors.errorContainer },
};

const styles = StyleSheet.create({
  base: {
    minHeight: size.button,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...type.labelLg,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
});
