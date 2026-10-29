import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';

const TABS = [
  { key: 'home', label: 'หน้าแรก', icon: 'home', iconOff: 'home-outline' },
  { key: 'overview', label: 'ภาพรวม', icon: 'grid', iconOff: 'grid-outline' },
  { key: 'add', label: 'สร้างงาน' },
  { key: 'notifications', label: 'แจ้งเตือน', icon: 'notifications', iconOff: 'notifications-outline' },
  { key: 'profile', label: 'โปรไฟล์', icon: 'person', iconOff: 'person-outline' },
];

// แท็บล่าง: หน้าแรก · ภาพรวม · (+) · แจ้งเตือน (ตัวเลขยังไม่อ่าน) · โปรไฟล์
export default function BottomTab({ active, onSelect, onAdd, unread = 0 }) {
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {TABS.map((tab) =>
        tab.key === 'add' ? (
          <View key={tab.key} style={styles.item}>
            <Pressable
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel="สร้างงานใหม่จากแม่แบบ"
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
            >
              <Ionicons name="add" size={size.icon + 8} color={colors.onPrimary} />
            </Pressable>
            <Text style={styles.label}>{tab.label}</Text>
          </View>
        ) : (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.key === 'notifications' && unread ? `${tab.label} ยังไม่อ่าน ${unread} รายการ` : tab.label}
            accessibilityState={{ selected: active === tab.key }}
            style={styles.item}
          >
            <View style={[styles.iconWrap, active === tab.key && styles.iconActive]}>
              <Ionicons
                name={active === tab.key ? tab.icon : tab.iconOff}
                size={size.icon}
                color={active === tab.key ? colors.primary : colors.muted}
              />
              {tab.key === 'notifications' && unread ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, active === tab.key && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: size.tabBar,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xs,
    ...elevation.card,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    minHeight: size.touch,
  },
  iconWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  iconActive: {
    backgroundColor: colors.primaryContainer,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: spacing.xs,
    minWidth: size.iconSm,
    height: size.iconSm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...type.labelSm,
    lineHeight: size.iconSm - 4,
    color: colors.onPrimary,
  },
  fab: {
    width: size.fab,
    height: size.fab,
    marginTop: -size.fab / 2,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: spacing.xs,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.fab,
  },
  fabPressed: {
    backgroundColor: colors.primaryPressed,
  },
  label: {
    ...type.labelSm,
    color: colors.muted,
  },
  labelActive: {
    color: colors.primary,
  },
});
