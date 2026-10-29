import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, size, categoryStyle, tint } from '../theme';

// ไอคอนหมวดบนพื้นสีอ่อนของหมวด · categoryKey ตรงกับ categories.key
export default function CategoryIcon({ categoryKey, big }) {
  const style = categoryStyle[categoryKey] || { color: colors.muted, icon: 'folder-outline' };
  const box = big ? size.categoryIcon + size.iconSm : size.categoryIcon;
  return (
    <View style={[styles.box, { width: box, height: box, backgroundColor: tint(style.color) }]}>
      <Ionicons name={style.icon} size={big ? size.icon + 6 : size.icon} color={style.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
