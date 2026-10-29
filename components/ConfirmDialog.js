import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { colors, spacing, radius, type, size } from '../theme';
import Button from './Button';

// กล่องยืนยันบนหน้าจอ (แทน Alert.alert ซึ่งใช้บนเว็บของ Snack ไม่ได้)
export default function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel, loading }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button label={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} loadingLabel="กำลังลบ…" />
            <Button label="ยกเลิก" variant="outline" onPress={onCancel} disabled={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
  },
  card: {
    width: '100%',
    maxWidth: size.maxWidth - spacing.xxl * 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...type.headlineMd,
    color: colors.onSurface,
  },
  message: {
    ...type.bodyMd,
    color: colors.muted,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
