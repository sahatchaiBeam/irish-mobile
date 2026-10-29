import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, type, size } from '../theme';
import { initials } from '../utils/taskStatus';

export default function Avatar({ name, large }) {
  const dimension = large ? size.avatar * 2 : size.avatar;
  return (
    <View
      style={[styles.circle, { width: dimension, height: dimension }]}
      accessibilityLabel={`รูปโปรไฟล์ ${name}`}
    >
      <Text style={[styles.text, large && styles.textLarge]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...type.labelSm,
    color: colors.onPrimary,
  },
  textLarge: {
    ...type.headlineMd,
  },
});
