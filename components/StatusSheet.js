import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radius, type, size } from '../theme';
import Button from './Button';
import Chip from './Chip';
import Notice from './Notice';
import { STATUS_TONES } from './StatusBadge';
import { nextStep, canReturn, stepsOf, destOf, docStatusLabel, RETURN_REASONS } from '../utils/docStatus';

// แผ่นอัปเดตสถานะเอกสาร (W7) เลื่อนขึ้นจากล่าง ทับหน้ารายละเอียดงาน
// ปุ่มใหญ่ปุ่มเดียวสำหรับขั้นถัดไป ใช้มือเดียวตอนยืนยื่นเอกสาร · "ถูกตีกลับ" แยกเป็นปุ่มด้านล่าง
// onSubmit({ status, holder, reason, note }) คืน Promise · ผิดพลาดแสดงใน error
export default function StatusSheet({ visible, task, doc, busy, error, onClose, onSubmit }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('main'); // 'main' | 'return'
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // เปิดเอกสารใหม่ทุกครั้งเริ่มที่หน้าหลักและล้างข้อความ
  useEffect(() => {
    setMode('main');
    setNote('');
    setReason('');
    setCustomReason('');
  }, [doc?.id, doc?.status]);

  if (!task || !doc) return null;

  const step = nextStep(task, doc);
  const { labels, current } = stepsOf(task, doc);
  const tone = STATUS_TONES[doc.status];
  const finalReason = (customReason.trim() || reason).trim();
  const now = doc.status === 'draft' ? 'ยังไม่ได้ยื่น' : `${docStatusLabel(doc.status)}${doc.holder ? ` · ${doc.holder}` : ''}`;
  const nextHolderIsOwner = step && step.holder === task.accountOwner;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="ปิดแผ่นอัปเดตสถานะ" />
        <View style={[styles.sheet, { paddingBottom: spacing.xl + insets.bottom }]} accessibilityViewIsModal>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="ปิด" hitSlop={12} style={styles.grabArea}>
            <View style={styles.grab} />
          </Pressable>

          <View style={styles.head}>
            <View style={styles.docIcon}>
              <Ionicons name="document-text-outline" size={size.icon} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.docName} accessibilityRole="header">
                {doc.name}
              </Text>
              <Text style={styles.now}>ตอนนี้: {now}</Text>
            </View>
          </View>

          <View style={styles.steps} accessibilityLabel={`ขั้นตอน ${labels.join(' ไป ')} ตอนนี้อยู่ขั้น ${Math.min(current + 1, 4)}`}>
            <View style={styles.stepLine} />
            {labels.map((label, i) => {
              const done = i < current;
              const isNow = i === current;
              return (
                <View key={label} style={styles.step}>
                  <View
                    style={[
                      styles.dot,
                      done && styles.dotDone,
                      isNow && { borderColor: tone.fg, backgroundColor: tone.bg, borderWidth: 3 },
                    ]}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={size.iconSm - 2} color={colors.onPrimary} />
                    ) : (
                      <Text style={[styles.dotText, isNow && { color: tone.fg }]}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isNow && { color: tone.fg, fontFamily: type.labelLg.fontFamily }]} numberOfLines={2}>
                    {isNow && doc.status === 'returned' ? 'ตีกลับ' : label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Notice tone="error" message={error} />

          {mode === 'main' ? (
            <View style={styles.body}>
              {step ? (
                <Pressable
                  onPress={() => onSubmit({ status: step.status, holder: step.holder, note })}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.label}, ${step.hint}`}
                  accessibilityState={{ disabled: !!busy, busy: !!busy }}
                  style={({ pressed }) => [styles.tall, pressed && styles.tallPressed, busy && styles.tallBusy]}
                >
                  <View style={styles.tallRow}>
                    <Ionicons name={busy ? 'hourglass-outline' : 'paper-plane-outline'} size={size.icon} color={colors.onPrimary} />
                    <Text style={styles.tallLabel}>{busy ? 'กำลังบันทึก…' : step.label}</Text>
                  </View>
                  <Text style={styles.tallHint}>{step.hint}</Text>
                </Pressable>
              ) : (
                <View style={[styles.tall, styles.tallDone]}>
                  <View style={styles.tallRow}>
                    <Ionicons name="checkmark-circle" size={size.icon} color={colors.success} />
                    <Text style={[styles.tallLabel, { color: colors.success }]}>ผ่านแล้ว</Text>
                  </View>
                  <Text style={[styles.tallHint, { color: colors.success }]}>เอกสารนี้จบขั้นตอนแล้ว</Text>
                </View>
              )}

              {step && step.holder ? (
                <View style={styles.group}>
                  <Text style={styles.label}>{step.status === 'waiting' ? 'รอใคร' : 'ส่งให้'}</Text>
                  <View style={styles.who}>
                    <Ionicons name={nextHolderIsOwner ? 'create-outline' : 'business-outline'} size={size.icon} color={colors.primary} />
                    <View style={styles.flex}>
                      <Text style={styles.whoName}>{step.holder}</Text>
                      <Text style={styles.whoHint}>
                        {nextHolderIsOwner ? 'เจ้าของบัญชีของงานนี้ (ใส่ให้อัตโนมัติ)' : 'ปลายทางของเอกสารนี้ (ใส่ให้อัตโนมัติ)'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {step ? (
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="หมายเหตุ (ไม่บังคับ) เช่น ฝากไว้ที่ห้องธุรการ"
                  placeholderTextColor={colors.outline}
                  accessibilityLabel="หมายเหตุ"
                  maxLength={300}
                  style={styles.note}
                />
              ) : null}

              {canReturn(doc) ? (
                <Button
                  label="ถูกตีกลับ… ระบุเหตุผล"
                  icon="arrow-undo-outline"
                  variant="danger"
                  disabled={busy}
                  onPress={() => setMode('return')}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={styles.label}>
                {doc.holder || destOf(task, doc)} ตีกลับเพราะอะไร
              </Text>
              <View style={styles.wrap}>
                {RETURN_REASONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={reason === r && !customReason.trim()}
                    onPress={() => {
                      setReason(r);
                      setCustomReason('');
                    }}
                  />
                ))}
              </View>
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="หรือพิมพ์เหตุผลเอง"
                placeholderTextColor={colors.outline}
                accessibilityLabel="เหตุผลที่ตีกลับ"
                maxLength={200}
                style={styles.note}
              />
              <View style={styles.two}>
                <View style={styles.flex}>
                  <Button label="ยกเลิก" variant="outline" disabled={busy} onPress={() => setMode('main')} />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="บันทึกว่าตีกลับ"
                    variant="danger"
                    disabled={!finalReason}
                    loading={busy}
                    loadingLabel="กำลังบันทึก…"
                    onPress={() => onSubmit({ status: 'returned', holder: doc.holder || destOf(task, doc), reason: finalReason, note })}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
  },
  sheet: {
    width: '100%',
    maxWidth: size.maxWidth,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  grabArea: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  grab: {
    width: size.touch,
    height: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.divider,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  docIcon: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    ...type.headlineMd,
    color: colors.onSurface,
  },
  now: {
    ...type.bodySm,
    color: colors.muted,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepLine: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    top: size.stepDot / 2 - spacing.xxs / 2,
    height: spacing.xxs,
    backgroundColor: colors.divider,
  },
  step: {
    width: '25%',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: size.stepDot,
    height: size.stepDot,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dotText: {
    ...type.labelMd,
    color: colors.muted,
  },
  stepLabel: {
    ...type.labelSm,
    color: colors.muted,
    textAlign: 'center',
  },
  body: {
    gap: spacing.md,
  },
  tall: {
    minHeight: size.buttonTall,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tallPressed: {
    backgroundColor: colors.primaryPressed,
  },
  tallBusy: {
    backgroundColor: colors.primaryPressed,
  },
  tallDone: {
    backgroundColor: colors.successContainer,
  },
  tallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tallLabel: {
    ...type.labelLg,
    color: colors.onPrimary,
    textAlign: 'center',
    flexShrink: 1,
  },
  tallHint: {
    ...type.labelSm,
    color: colors.onPrimary,
  },
  group: {
    gap: spacing.xs,
  },
  label: {
    ...type.labelMd,
    color: colors.onSurface,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: size.input,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  whoName: {
    ...type.titleMd,
    color: colors.onSurface,
  },
  whoHint: {
    ...type.labelSm,
    color: colors.muted,
  },
  note: {
    ...type.bodySm,
    minHeight: size.touch,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.onSurface,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  two: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
