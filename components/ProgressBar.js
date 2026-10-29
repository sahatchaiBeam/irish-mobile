import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, size } from '../theme';

// แถบความคืบหน้า "ผ่านแล้ว x/y" (สีผ่าน บนพื้นเส้นคั่น)
export default function ProgressBar({ value, total, thick }) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  const height = thick ? size.progress + 2 : size.progress;
  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      accessibilityLabel={`ผ่านแล้ว ${value} จาก ${total}`}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radius.full,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
});
