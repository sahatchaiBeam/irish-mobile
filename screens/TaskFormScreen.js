import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, type, size, elevation } from '../theme';
import Header from '../components/Header';
import TextField from '../components/TextField';
import Chip from '../components/Chip';
import Button from '../components/Button';
import Notice from '../components/Notice';
import StateView from '../components/StateView';
import { fetchCategories, fetchTemplates, fetchTasks, createTask, updateTask, validateTask } from '../data/api';
import { todayISO, addDaysISO, formatThaiDate, daysBetween } from '../utils/dates';

const QUICK_DUE = [
  { label: 'อีก 1 สัปดาห์', days: 7 },
  { label: 'อีก 2 สัปดาห์', days: 14 },
  { label: 'อีก 1 เดือน', days: 30 },
];

// สร้างงานจากแม่แบบ (W6) หรือแก้ไขงานเดิม (task = งาน)
// เลือกแม่แบบก่อน รายการเอกสารที่ต้องมีเติมให้ (ความรู้ของคนเก่าอยู่ในแม่แบบ) · บังคับระบุเจ้าของบัญชี
export default function TaskFormScreen({ task, defaultCategoryId, onBack, onSaved }) {
  const isEdit = !!task;
  const today = todayISO();
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [ownerSuggestions, setOwnerSuggestions] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [templateKey, setTemplateKey] = useState(task?.templateKey ?? null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? defaultCategoryId ?? null);
  const [accountOwner, setAccountOwner] = useState(task?.accountOwner ?? '');
  const [recipient, setRecipient] = useState(task?.recipient ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? addDaysISO(today, 14));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoadState('loading');
    try {
      const [cats, tpls, tasks] = await Promise.all([fetchCategories(), fetchTemplates(), fetchTasks()]);
      setCategories(cats);
      setTemplates(tpls);
      setOwnerSuggestions([...new Set(tasks.map((t) => t.accountOwner).filter(Boolean))].slice(0, 4));
      // มีทีมเดียว (เช่น แล็บที่ใช้ร่วมกับเว็บ) เลือกให้เลย
      if (!isEdit && !defaultCategoryId && cats.length === 1) setCategoryId(cats[0].id);
      // มาจากหน้าส่วนงาน: เลือกแม่แบบของส่วนนั้นให้ ถ้ามี
      if (!isEdit && defaultCategoryId) {
        const key = cats.find((c) => c.id === defaultCategoryId)?.key;
        const match = tpls.find((t) => t.categoryKey === key);
        if (match) chooseTemplate(match, cats);
      }
      setLoadState('ready');
    } catch (e) {
      setLoadError(e.message);
      setLoadState('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const template = templates.find((t) => t.key === templateKey) || null;

  function chooseTemplate(tpl, cats = categories) {
    setTemplateKey(tpl.key);
    setErrors((e) => ({ ...e, templateKey: undefined }));
    if (tpl.categoryKey) setCategoryId(cats.find((c) => c.key === tpl.categoryKey)?.id ?? null);
    // "ส่งให้" ตามแม่แบบ ถ้ายังไม่ได้พิมพ์เอง
    if (!recipient.trim() || templates.some((t) => t.dest === recipient)) setRecipient(tpl.dest);
  }

  async function handleSave() {
    setFormError('');
    const input = { templateKey, title, categoryId, accountOwner, recipient, dueDate, description };
    const found = validateTask(input, { isCreate: !isEdit });
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('กรุณาตรวจข้อมูลที่มีเครื่องหมาย * ให้ครบ');
      return;
    }
    setSaving(true);
    try {
      const saved = isEdit
        ? await updateTask(task.id, { title, categoryId, accountOwner, recipient, dueDate, description })
        : await createTask({ ...input, documents: template?.documents || [] });
      onSaved(saved, isEdit);
    } catch (e) {
      setFormError(e.message);
      setSaving(false);
    }
  }

  const offset = daysBetween(today, dueDate);
  const showCategoryChips = isEdit || (template && !template.categoryKey);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header
          eyebrow={isEdit ? 'แก้ไขงาน' : 'งานใหม่'}
          title={isEdit ? 'แก้ไขรายละเอียดงาน' : 'สร้างงาน'}
          subtitle="ใช้เอกสารอะไร · ใครเซ็น · ส่งให้ใคร"
          onBack={onBack}
          backLabel="ยกเลิก"
        />

        <View style={styles.form}>
          <Notice tone="error" message={formError} />
          {loadState === 'loading' ? <StateView kind="loading" message="กำลังโหลดแม่แบบ…" /> : null}
          {loadState === 'error' ? <StateView kind="error" message={loadError} actionLabel="ลองใหม่" onAction={load} /> : null}

          {!isEdit && loadState === 'ready' ? (
            <View style={styles.group}>
              <Text style={styles.label}>แม่แบบ *</Text>
              <View style={styles.wrap}>
                {templates.map((tpl) => (
                  <Chip key={tpl.key} label={tpl.name} selected={templateKey === tpl.key} onPress={() => chooseTemplate(tpl)} />
                ))}
              </View>
              {errors.templateKey ? <Text style={styles.error}>{errors.templateKey}</Text> : null}
            </View>
          ) : null}

          {!isEdit && template ? (
            <View style={styles.group}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>เอกสารที่ต้องมี</Text>
                <Text style={styles.hint}>มากับแม่แบบ · {template.documents.length} รายการ</Text>
              </View>
              <View style={styles.docCard}>
                {template.documents.length === 0 ? (
                  <Text style={styles.hint}>แม่แบบนี้ไม่มีรายการตั้งต้น เพิ่มเอกสารได้ในหน้างานหลังสร้าง</Text>
                ) : (
                  template.documents.map((d, i) => (
                    <View key={d.name} style={[styles.docRow, i > 0 && styles.divider]}>
                      <Ionicons name="document-text-outline" size={size.iconSm} color={colors.primary} />
                      <Text style={styles.docName}>{d.name}</Text>
                      {d.personal ? <Ionicons name="lock-closed" size={size.iconSm - 4} color={colors.muted} accessibilityLabel="ข้อมูลส่วนบุคคล" /> : null}
                    </View>
                  ))
                )}
              </View>
              <Text style={styles.hint}>เพิ่มหรือลบเอกสารได้ภายหลังในหน้างาน</Text>
            </View>
          ) : null}

          <TextField
            label="ชื่องาน *"
            value={title}
            onChangeText={setTitle}
            placeholder={template?.key === 'procurement' ? 'เช่น จัดซื้อวัสดุสำหรับอบรม' : 'เช่น อบรม ROS 2 รุ่นที่ 4'}
            error={errors.title}
            maxLength={120}
          />

          {showCategoryChips ? (
            <View style={styles.group}>
              <Text style={styles.label}>ส่วนงาน *</Text>
              <View style={styles.wrap}>
                {categories.map((c) => (
                  <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
                ))}
              </View>
              {errors.categoryId ? <Text style={styles.error}>{errors.categoryId}</Text> : null}
            </View>
          ) : null}

          <View style={styles.group}>
            <TextField
              label="เจ้าของบัญชี (ผู้เซ็น) *"
              value={accountOwner}
              onChangeText={setAccountOwner}
              placeholder="เช่น อ.เจ้าของโครงการ"
              error={errors.accountOwner}
              hint={'แต่ละโครงการเจ้าของบัญชีคนละคน ใช้เป็น "รอใคร" ตอนยื่นเซ็น'}
              maxLength={120}
            />
            {ownerSuggestions.length ? (
              <View style={styles.wrap}>
                {ownerSuggestions.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={accountOwner === name}
                    onPress={() => {
                      setAccountOwner(name);
                      setErrors((e) => ({ ...e, accountOwner: undefined }));
                    }}
                    accessibilityLabel={`ใช้ ${name} เป็นเจ้าของบัญชี`}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <TextField
            label="ส่งให้ (ปลายทาง)"
            value={recipient}
            onChangeText={setRecipient}
            placeholder="เช่น การเงิน, พัสดุ"
            hint="หน่วยงานที่ตรวจ/อนุมัติเอกสาร เติมจากแม่แบบให้"
          />

          <View style={styles.group}>
            <Text style={styles.label}>กำหนดส่ง *</Text>
            <View style={styles.dateRow}>
              <Pressable
                onPress={() => setDueDate(addDaysISO(dueDate, -1))}
                accessibilityRole="button"
                accessibilityLabel="เลื่อนกำหนดส่งเร็วขึ้น 1 วัน"
                style={styles.stepper}
              >
                <Ionicons name="chevron-back" size={size.icon} color={colors.primary} />
              </Pressable>
              <View style={styles.dateBox}>
                <Text style={styles.dateText}>{formatThaiDate(dueDate, { weekday: true })}</Text>
                <Text style={[styles.dateHint, offset < 0 && styles.error]}>
                  {offset === 0 ? 'วันนี้' : offset > 0 ? `อีก ${offset} วัน` : `ผ่านมาแล้ว ${-offset} วัน`}
                </Text>
              </View>
              <Pressable
                onPress={() => setDueDate(addDaysISO(dueDate, 1))}
                accessibilityRole="button"
                accessibilityLabel="เลื่อนกำหนดส่งออกไป 1 วัน"
                style={styles.stepper}
              >
                <Ionicons name="chevron-forward" size={size.icon} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.wrap}>
              {QUICK_DUE.map((q) => (
                <Chip
                  key={q.label}
                  label={q.label}
                  selected={dueDate === addDaysISO(today, q.days)}
                  onPress={() => setDueDate(addDaysISO(today, q.days))}
                />
              ))}
            </View>
            {errors.dueDate ? <Text style={styles.error}>{errors.dueDate}</Text> : null}
          </View>

          <TextField
            label="รายละเอียด"
            value={description}
            onChangeText={setDescription}
            placeholder="สิ่งที่คนต่อไปควรรู้ เช่น ใช้งบโครงการไหน"
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label={isEdit ? 'บันทึกการแก้ไข' : 'สร้างงาน'}
          icon={isEdit ? 'save-outline' : 'add-circle-outline'}
          onPress={handleSave}
          loading={saving}
          loadingLabel="กำลังบันทึก…"
          disabled={loadState !== 'ready'}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  form: {
    padding: spacing.screen,
    gap: spacing.xl,
  },
  group: {
    gap: spacing.sm,
  },
  label: {
    ...type.labelMd,
    color: colors.onSurface,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  hint: {
    ...type.bodySm,
    color: colors.muted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    ...type.bodySm,
    color: colors.error,
  },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    ...elevation.card,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  docName: {
    ...type.bodyMd,
    color: colors.onSurface,
    flexShrink: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepper: {
    width: size.input,
    height: size.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBox: {
    flex: 1,
    minHeight: size.input,
    borderRadius: radius.md,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  dateText: {
    ...type.titleMd,
    color: colors.primary,
  },
  dateHint: {
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
