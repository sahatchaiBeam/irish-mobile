import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, type, size } from '../theme';
import Button from './Button';

// state ที่รูปต้นแบบไม่ได้แสดง: kind = 'loading' | 'error' | 'empty'
const ICONS = { error: 'cloud-offline-outline', empty: 'document-text-outline' };

export default function StateView({ kind, message, actionLabel, onAction }) {
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      {kind === 'loading' ? (
        <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="กำลังโหลด" />
      ) : (
        <Ionicons name={ICONS[kind]} size={size.fab} color={kind === 'error' ? colors.error : colors.outline} />
      )}
      {message ? <Text style={[styles.message, kind === 'error' && styles.error]}>{message}</Text> : null}
      {actionLabel ? (
        <View style={styles.action}>
          <Button label={actionLabel} variant="outline" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.screen,
  },
  message: {
    ...type.titleMd,
    color: colors.onSurface,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});
