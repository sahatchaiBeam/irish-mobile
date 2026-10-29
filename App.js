import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  NotoSansThai_400Regular,
  NotoSansThai_500Medium,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
} from '@expo-google-fonts/noto-sans-thai';
import { colors, spacing, size } from './theme';
import { getCurrentUser, onAuthChange, fetchNotifications } from './data/api';
import BottomTab from './components/BottomTab';
import Notice from './components/Notice';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import OverviewScreen from './screens/OverviewScreen';
import SectionScreen from './screens/SectionScreen';
import TaskDetailScreen from './screens/TaskDetailScreen';
import TaskFormScreen from './screens/TaskFormScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';

// ชื่อหน้า: 'home' (W2) | 'overview' (W3) | 'section' (W4) | 'task' (W5 + แผ่น W7) | 'taskForm' (W6)
//          | 'notifications' (W8) | 'profile' (W9) · ก่อนล็อกอินคือ LoginScreen (W1)
const TAB_SCREENS = ['home', 'overview', 'notifications', 'profile'];

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded, fontError] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_500Medium,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
  });

  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  // stack ของหน้า: ตัวสุดท้ายคือหน้าปัจจุบัน { name, params }
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);
  const [flash, setFlash] = useState('');
  const [unread, setUnread] = useState(0);
  const flashTimer = useRef(null);

  // เปิดแอปแล้วยังล็อกอินอยู่ไหม (Supabase เก็บ session ไว้ในเครื่อง)
  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
    return onAuthChange(setUser);
  }, []);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // ตัวเลขยังไม่อ่านบนแท็บแจ้งเตือน: โหลดใหม่ทุกครั้งที่เปลี่ยนหน้า หรือมีการอัปเดตสถานะ
  const refreshBadge = useCallback(() => {
    if (!user) return;
    fetchNotifications(user)
      .then((result) => setUnread(result.unread))
      .catch(() => {});
  }, [user]);

  const current = stack[stack.length - 1];

  useEffect(() => {
    refreshBadge();
  }, [refreshBadge, current.name]);

  const go = (name, params = {}) => setStack((s) => [...s, { name, params }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const switchTab = (name) => setStack([{ name, params: {} }]);
  const openTask = (taskId, docId) => go('task', { taskId, openDocId: docId || null });

  function showFlash(message) {
    clearTimeout(flashTimer.current);
    setFlash(message);
    flashTimer.current = setTimeout(() => setFlash(''), 3000);
  }

  if ((!fontsLoaded && !fontError) || checkingSession) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="กำลังโหลด" />
      </View>
    );
  }

  const hasTabs = TAB_SCREENS.includes(current.name);

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={[styles.app, { paddingBottom: insets.bottom }]}>
        {!user ? (
          <LoginScreen
            onSignedIn={(signedIn) => {
              setUser(signedIn);
              switchTab('home');
            }}
          />
        ) : (
          <>
            <View style={styles.flex}>{renderScreen()}</View>
            {flash ? (
              <View style={[styles.flash, !hasTabs && styles.flashNoTabs]} pointerEvents="none">
                <Notice tone="success" message={flash} />
              </View>
            ) : null}
            {hasTabs ? (
              <BottomTab active={current.name} onSelect={switchTab} onAdd={() => go('taskForm')} unread={unread} />
            ) : null}
          </>
        )}
      </View>
    </View>
  );

  function renderScreen() {
    const { name, params } = current;
    switch (name) {
      case 'overview':
        return <OverviewScreen onOpenSection={(category) => go('section', { category })} />;
      case 'section':
        return (
          <SectionScreen
            key={`${params.category?.id ?? 'all'}-${params.filter ?? 'all'}`}
            category={params.category}
            initialFilter={params.filter}
            onBack={back}
            onOpenTask={(taskId) => openTask(taskId)}
            onCreateTask={(categoryId) => go('taskForm', { defaultCategoryId: categoryId })}
          />
        );
      case 'task':
        return (
          <TaskDetailScreen
            key={params.taskId}
            taskId={params.taskId}
            openDocId={params.openDocId}
            user={user}
            onBack={back}
            onEdit={(task) => go('taskForm', { task })}
            onDeleted={(title) => {
              back();
              showFlash(`ลบงาน "${title}" แล้ว`);
            }}
            onChanged={refreshBadge}
            onFlash={showFlash}
          />
        );
      case 'taskForm':
        return (
          <TaskFormScreen
            task={params.task}
            defaultCategoryId={params.defaultCategoryId}
            onBack={back}
            onSaved={(saved, isEdit) => {
              // แก้ไข: กลับไปหน้ารายละเอียดเดิม · สร้างใหม่: เปิดหน้ารายละเอียดของงานใหม่แทนฟอร์ม
              setStack((s) => (isEdit ? s.slice(0, -1) : [...s.slice(0, -1), { name: 'task', params: { taskId: saved.id } }]));
              showFlash(
                isEdit ? 'บันทึกการแก้ไขแล้ว' : `สร้างงาน "${saved.title}" แล้ว · เอกสารที่ต้องมี ${saved.documents.length} รายการ`,
              );
            }}
          />
        );
      case 'notifications':
        return <NotificationsScreen user={user} onOpen={openTask} onChanged={refreshBadge} />;
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onSignedOut={() => {
              setUser(null);
              setUnread(0);
              switchTab('home');
            }}
          />
        );
      default:
        return (
          <HomeScreen
            user={user}
            onOpenTask={(taskId) => openTask(taskId)}
            onOpenDoc={openTask}
            onOpenFiltered={(status) => go('section', { category: null, filter: status })}
            onOpenProfile={() => switchTab('profile')}
            onCreateTask={() => go('taskForm')}
          />
        );
    }
  }
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: size.maxWidth,
    alignSelf: 'center',
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  flash: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    bottom: size.tabBar + spacing.lg,
  },
  flashNoTabs: {
    bottom: size.button + spacing.xxl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
