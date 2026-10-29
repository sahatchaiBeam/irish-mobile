import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size } from '../theme';

// แถบข้อความบนหน้าจอ: tone = 'error' | 'success' | 'info'
const TONES = {
  error: { bg: colors.errorContainer, fg: colors.error, icon: 'alert-circle' },
  success: { bg: colors.successContainer, fg: colors.success, icon: 'checkmark-circle' },
  info: { bg: colors.primaryContainer, fg: colors.primary, icon: 'information-circle' },
};

export default function Notice({ tone = 'info', message }) {
  if (!message) return null;
  const t = TONES[tone];
  return (
    <View style={[styles.box, { backgroundColor: t.bg }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Ionicons name={t.icon} size={size.icon} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  text: {
    ...type.bodySm,
    flex: 1,
  },
});
