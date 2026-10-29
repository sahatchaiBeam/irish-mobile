import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header, { HeaderIconButton } from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Notice from '../components/Notice';
import StateView from '../components/StateView';
import ConfirmDialog from '../components/ConfirmDialog';
import DocRow from '../components/DocRow';
import ProgressBar from '../components/ProgressBar';
import StatusSheet from '../components/StatusSheet';
import {
  fetchTask,
  fetchCategories,
  fetchTemplates,
  fetchTaskEvents,
  deleteTask,
  addDocument,
  deleteDocument,
  setDocumentStatus,
} from '../data/api';
import { deadlineLine } from '../utils/taskStatus';
import { progressOf, nextOpenDoc, docStatusLabel } from '../utils/docStatus';
import { whenText } from '../utils/notifications';

const HISTORY_PREVIEW = 4;

// รายละเอียดงาน (W5): ใคร (ผู้รับผิดชอบ · เจ้าของบัญชี · ส่งให้) · เอกสารที่ต้องมี x/y · ประวัติ
// แตะเอกสาร หรือปุ่ม "อัปเดตสถานะ" → แผ่นอัปเดตสถานะ (W7)
export default function TaskDetailScreen({ taskId, openDocId, user, onBack, onEdit, onDeleted, onChanged, onFlash }) {
  const [task, setTask] = useState(null);
  const [category, setCategory] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null); // { tone, message }
  const [sheetDocId, setSheetDocId] = useState(null);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [editingDocs, setEditingDocs] = useState(false);
  const [newDoc, setNewDoc] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const openedFromLink = useRef(false);

  const load = useCallback(async () => {
    try {
      const [row, cats, templates, history] = await Promise.all([
        fetchTask(taskId),
        fetchCategories(),
        fetchTemplates(),
        fetchTaskEvents(taskId),
      ]);
      setTask(row);
      setCategory(cats.find((c) => c.id === row.categoryId) || null);
      setTemplateName(templates.find((t) => t.key === row.templateKey)?.name || 'ไม่มีแม่แบบ');
      setEvents(history);
      setStatus('ready');
      return row;
    } catch (e) {
      setError(e.message);
      setStatus('error');
      return null;
    }
  }, [taskId]);

  // เปิดจากแจ้งเตือน / "ต้องทำต่อ": เปิดแผ่นของเอกสารนั้นทันทีครั้งแรก
  useEffect(() => {
    load().then((row) => {
      if (row && openDocId && !openedFromLink.current && row.documents.some((d) => d.id === openDocId)) {
        openedFromLink.current = true;
        setSheetDocId(openDocId);
      }
    });
  }, [load, openDocId]);

  function openSheet(docId) {
    setSheetError('');
    setSheetDocId(docId);
  }

  async function handleStatus(change) {
    const doc = task.documents.find((d) => d.id === sheetDocId);
    setSheetBusy(true);
    setSheetError('');
    try {
      await setDocumentStatus(task.id, doc.id, change);
      const fresh = await load();
      setSheetDocId(null);
      const p = fresh ? progressOf(fresh) : null;
      onFlash(
        change.status === 'passed'
          ? `"${doc.name}" ผ่านแล้ว · ผ่านแล้ว ${p.passed}/${p.total}`
          : change.status === 'returned'
            ? `บันทึกว่าตีกลับ: ${change.reason}`
            : `บันทึกแล้ว · ${docStatusLabel(change.status)} · ${change.holder}`,
      );
      onChanged();
    } catch (e) {
      setSheetError(e.message);
    } finally {
      setSheetBusy(false);
    }
  }

  async function run(action, successMessage) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      await load();
      if (successMessage) setNotice({ tone: 'success', message: successMessage });
      onChanged();
    } catch (e) {
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setBusy(false);
    }
  }

  function handleAddDoc() {
    run(async () => {
      await addDocument(task.id, newDoc);
      setNewDoc('');
    }, `เพิ่ม "${newDoc.trim()}" แล้ว`);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      setConfirmOpen(false);
      onDeleted(task.title);
    } catch (e) {
      setConfirmOpen(false);
      setNotice({ tone: 'error', message: e.message });
    } finally {
      setDeleting(false);
    }
  }

  if (status !== 'ready') {
    return (
      <View style={styles.flex}>
        <Header eyebrow="รายละเอียดงาน" onBack={onBack} />
        {status === 'loading' ? (
          <StateView kind="loading" message="กำลังโหลดงาน…" />
        ) : (
          <StateView kind="error" message={`โหลดงานไม่สำเร็จ\n${error}`} actionLabel="ลองใหม่" onAction={load} />
        )}
      </View>
    );
  }

  const isOwner = task.ownerId === user.id;
  const { passed, total } = progressOf(task);
  const next = nextOpenDoc(task);
  const sheetDoc = task.documents.find((d) => d.id === sheetDocId) || null;
  const line = deadlineLine(task);
  const history = showAllHistory ? events : events.slice(0, HISTORY_PREVIEW);

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header
          eyebrow={category?.name ?? 'งาน'}
          title={task.title}
          subtitle={`แม่แบบ: ${templateName} · ${line.text}`}
          onBack={onBack}
          right={<HeaderIconButton icon="create-outline" label="แก้ไขงาน" onPress={() => onEdit(task)} />}
          overlap
        />

        <View style={[styles.card, styles.people]}>
          <InfoRow icon="person-outline" label="ผู้รับผิดชอบ">
            <View style={styles.personRow}>
              <Avatar name={task.ownerName} />
              <Text style={styles.value}>{task.ownerName}</Text>
            </View>
          </InfoRow>
          <InfoRow icon="create-outline" label="เจ้าของบัญชี" divider>
            <Text style={styles.value}>{task.accountOwner}</Text>
          </InfoRow>
          <InfoRow icon="paper-plane-outline" label="ส่งให้" divider>
            <Text style={styles.value}>{task.recipient || '— ยังไม่ระบุ —'}</Text>
          </InfoRow>
        </View>

        <View style={styles.section}>
          <Notice tone={notice?.tone} message={notice?.message} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>เอกสารที่ต้องมี</Text>
            <Text style={styles.progress}>
              ผ่านแล้ว {passed}/{total}
            </Text>
          </View>
          <ProgressBar value={passed} total={total} thick />
          <View style={styles.card}>
            {total === 0 ? <Text style={styles.empty}>ยังไม่มีรายการเอกสาร กด "แก้รายการ" เพื่อเพิ่ม</Text> : null}
            {task.documents.map((doc, i) =>
              editingDocs ? (
                <View key={doc.id} style={[styles.editRow, i > 0 && styles.divider]}>
                  <Text style={styles.editName}>{doc.name}</Text>
                  <Pressable
                    onPress={() => run(() => deleteDocument(task.id, doc.id), `ลบ "${doc.name}" ออกจากงานแล้ว`)}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={`ลบเอกสาร ${doc.name} ออกจากงาน`}
                    hitSlop={8}
                    style={styles.trash}
                  >
                    <Ionicons name="trash-outline" size={size.icon} color={colors.error} />
                  </Pressable>
                </View>
              ) : (
                <DocRow key={doc.id} doc={doc} first={i === 0} onPress={() => openSheet(doc.id)} />
              ),
            )}
            {editingDocs ? (
              <View style={styles.addRow}>
                <TextInput
                  value={newDoc}
                  onChangeText={setNewDoc}
                  placeholder="เพิ่มเอกสาร เช่น ใบขออนุมัติเดินทาง"
                  placeholderTextColor={colors.outline}
                  accessibilityLabel="ชื่อเอกสารใหม่"
                  maxLength={120}
                  style={styles.addInput}
                  onSubmitEditing={handleAddDoc}
                />
                <Pressable
                  onPress={handleAddDoc}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel="เพิ่มเอกสาร"
                  style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}
                >
                  <Ionicons name="add" size={size.icon} color={colors.onPrimary} />
                </Pressable>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => setEditingDocs(!editingDocs)}
            accessibilityRole="button"
            accessibilityLabel={editingDocs ? 'เสร็จสิ้นการแก้รายการเอกสาร' : 'แก้รายการเอกสาร เพิ่มหรือลบ'}
            style={styles.linkButton}
          >
            <Ionicons name={editingDocs ? 'checkmark' : 'list-outline'} size={size.iconSm} color={colors.primary} />
            <Text style={styles.link}>{editingDocs ? 'เสร็จสิ้น' : 'แก้รายการ (เพิ่ม / ลบเอกสาร)'}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ประวัติ</Text>
          <View style={styles.card}>
            {events.length === 0 ? <Text style={styles.empty}>ยังไม่มีการเปลี่ยนสถานะ</Text> : null}
            {history.map((ev, i) => (
              <View key={ev.id} style={[styles.event, i > 0 && styles.divider]}>
                <Text style={styles.eventTitle}>
                  {ev.docName}: {ev.fromStatus ? `${docStatusLabel(ev.fromStatus)} → ` : ''}
                  {docStatusLabel(ev.toStatus)}
                  {ev.holder ? ` · ${ev.holder}` : ''}
                </Text>
                {ev.reason ? <Text style={styles.eventReason}>เหตุผล: {ev.reason}</Text> : null}
                {ev.note ? <Text style={styles.eventMeta}>หมายเหตุ: {ev.note}</Text> : null}
                <Text style={styles.eventMeta}>
                  {ev.actorName} · {whenText(ev.createdAt)}
                </Text>
              </View>
            ))}
            {events.length > HISTORY_PREVIEW ? (
              <Pressable
                onPress={() => setShowAllHistory(!showAllHistory)}
                accessibilityRole="button"
                accessibilityLabel={showAllHistory ? 'ย่อประวัติ' : `ดูประวัติทั้งหมด ${events.length} รายการ`}
                style={styles.linkButton}
              >
                <Text style={styles.link}>{showAllHistory ? 'ย่อ' : `ดูทั้งหมด (${events.length})`}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          {isOwner ? (
            <Button label="ลบงานนี้" icon="trash-outline" variant="danger" onPress={() => setConfirmOpen(true)} />
          ) : (
            <Text style={styles.empty}>ลบงานได้เฉพาะผู้สร้างงาน ({task.ownerName})</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {next ? (
          <Button label="อัปเดตสถานะ" icon="document-text-outline" onPress={() => openSheet(next.id)} accessibilityLabel={`อัปเดตสถานะ ${next.name}`} />
        ) : (
          <Button label={total ? 'เอกสารผ่านครบแล้ว' : 'ยังไม่มีเอกสาร'} icon="checkmark-circle-outline" disabled />
        )}
      </View>

      <StatusSheet
        visible={!!sheetDoc}
        task={task}
        doc={sheetDoc}
        busy={sheetBusy}
        error={sheetError}
        onClose={() => setSheetDocId(null)}
        onSubmit={handleStatus}
      />

      <ConfirmDialog
        visible={confirmOpen}
        title="ลบงานนี้?"
        message={`"${task.title}" เอกสารที่ต้องมีและประวัติทั้งหมดจะถูกลบ และกู้คืนไม่ได้`}
        confirmLabel="ลบงาน"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

function InfoRow({ icon, label, divider, children }) {
  return (
    <View style={[styles.infoRow, divider && styles.divider]}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={size.iconSm} color={colors.primary} />
        <Text style={styles.caption}>{label}</Text>
      </View>
      <View style={styles.flex}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...elevation.card,
  },
  people: {
    marginHorizontal: spacing.screen,
    marginTop: -spacing.xxl * 2 + spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: size.input,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '40%',
  },
  caption: {
    ...type.bodySm,
    color: colors.muted,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  value: {
    ...type.titleMd,
    color: colors.onSurface,
    flexShrink: 1,
  },
  section: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    ...type.headlineMd,
    color: colors.onSurface,
  },
  progress: {
    ...type.labelLg,
    color: colors.primary,
  },
  empty: {
    ...type.bodySm,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: size.input,
  },
  editName: {
    ...type.bodyMd,
    color: colors.onSurface,
    flex: 1,
  },
  trash: {
    width: size.touch,
    height: size.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  addInput: {
    ...type.bodyMd,
    flex: 1,
    minHeight: size.touch,
    color: colors.onSurface,
  },
  addButton: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: {
    backgroundColor: colors.primaryPressed,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: size.touch,
  },
  link: {
    ...type.labelMd,
    color: colors.primary,
  },
  event: {
    paddingVertical: spacing.md,
    gap: spacing.xxs,
  },
  eventTitle: {
    ...type.labelMd,
    color: colors.onSurface,
  },
  eventReason: {
    ...type.bodySm,
    color: colors.error,
  },
  eventMeta: {
    ...type.labelSm,
    color: colors.muted,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
