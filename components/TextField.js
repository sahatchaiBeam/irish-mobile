import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius, type, size } from '../theme';

// label อยู่เหนือช่องเสมอ · error แสดงใต้ช่องเป็นข้อความสีแดง (DESIGN.md › Components › Input)
export default function TextField({ label, error, multiline, hint, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.outline}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error && styles.inputError,
        ]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    ...type.labelMd,
    color: colors.onSurface,
  },
  input: {
    ...type.bodyMd,
    minHeight: size.input,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  multiline: {
    minHeight: size.input * 2,
    textAlignVertical: 'top',
  },
  focused: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    ...type.bodySm,
    color: colors.error,
  },
  hint: {
    ...type.bodySm,
    color: colors.muted,
  },
});
