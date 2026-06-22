import { color, Hamburg } from "@/assets/fonts/sharedStyles";
import {
  FollowUp,
  useCompleteFollowUp,
  useCreateFollowUp,
  useDeleteFollowUp,
  useFollowUps,
  useUpdateFollowUp,
} from "@/src/api/follow-up";
import {
  cancelFollowUpNotification,
  scheduleFollowUpNotification,
} from "@/src/notifications/follow-ups";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  IconBell,
  IconChecklist,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function groupFollowUps(items: FollowUp[]) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const overdue: FollowUp[] = [];
  const today: FollowUp[] = [];
  const upcoming: FollowUp[] = [];

  for (const item of items) {
    const due = new Date(item.due_at);
    if (due < todayStart) overdue.push(item);
    else if (due < tomorrowStart) today.push(item);
    else upcoming.push(item);
  }

  return { overdue, today, upcoming };
}

function formatDue(
  iso: string,
  group: "overdue" | "today" | "upcoming",
): string {
  const d = new Date(iso);
  const hhmm = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (group === "today") return hhmm;

  if (group === "overdue") {
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return `Earlier today, ${hhmm}`;
    if (diffDays === 1) return `Yesterday, ${hhmm}`;
    return `${diffDays}d overdue`;
  }

  // upcoming
  const todayStart = startOfDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrowStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

  if (d < dayAfterTomorrow) return `Tomorrow, ${hhmm}`;

  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    ` at ${hhmm}`
  );
}

function defaultFormDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

// ─── screen ──────────────────────────────────────────────────────────────────

type SheetMode = "add" | "edit";

export default function FollowUpsScreen() {
  const insets = useSafeAreaInsets();

  const { data: followUps = [], isLoading, refetch } = useFollowUps();
  const { mutate: completeFollowUp } = useCompleteFollowUp();
  const { mutate: createFollowUp, isPending: isCreating } = useCreateFollowUp();
  const { mutate: updateFollowUp, isPending: isUpdating } = useUpdateFollowUp();
  const { mutate: deleteFollowUp } = useDeleteFollowUp();

  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState<Date>(defaultFormDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const groups = useMemo(() => groupFollowUps(followUps), [followUps]);
  const hasAny = followUps.length > 0;

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  function openAdd() {
    setSheetMode("add");
    setEditingId(null);
    setFormTitle("");
    setFormDate(defaultFormDate());
    setShowDatePicker(false);
    setShowTimePicker(false);
    sheetRef.current?.present();
  }

  function openEdit(item: FollowUp) {
    setSheetMode("edit");
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDate(new Date(item.due_at));
    setShowDatePicker(false);
    setShowTimePicker(false);
    sheetRef.current?.present();
  }

  function handleComplete(item: FollowUp) {
    completeFollowUp(item.id, {
      onSuccess: () => {
        cancelFollowUpNotification(item.id);
      },
    });
  }

  function handleDeleteFromSheet() {
    if (editingId === null) return;
    const item = followUps.find((f) => f.id === editingId);
    Alert.alert(
      "Delete reminder",
      item ? `Delete "${item.title}"?` : "Delete this reminder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            sheetRef.current?.dismiss();
            deleteFollowUp(editingId, {
              onSuccess: () => {
                cancelFollowUpNotification(editingId);
              },
            });
          },
        },
      ],
    );
  }

  function handleSubmit() {
    if (!formTitle.trim()) return;

    if (sheetMode === "add") {
      createFollowUp(
        { title: formTitle.trim(), due_at: formDate.toISOString() },
        {
          onSuccess: (created) => {
            sheetRef.current?.dismiss();
            scheduleFollowUpNotification(created);
          },
        },
      );
    } else {
      updateFollowUp(
        {
          id: editingId!,
          data: { title: formTitle.trim(), due_at: formDate.toISOString() },
        },
        {
          onSuccess: (updated) => {
            sheetRef.current?.dismiss();
            cancelFollowUpNotification(updated.id).then(() =>
              scheduleFollowUpNotification(updated),
            );
          },
        },
      );
    }
  }

  const isSaving = isCreating || isUpdating;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 80 },
        ]}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={color.PRIMARY}
            colors={[color.PRIMARY]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>
            Follow<Text style={{ fontFamily: undefined }}>-</Text>ups
          </Text>
          <Text style={styles.headerSub}>Stay on top of your applications</Text>
        </View>

        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator color={color.PRIMARY} size="large" />
          </View>
        )}

        {!isLoading && !hasAny && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <IconChecklist
                size={36}
                color={color.PRIMARY}
                strokeWidth={1.5}
              />
            </View>
            <Text style={styles.emptyTitle}>Nothing -- to chase right now</Text>
            <Text style={styles.emptyBody}>
              Tap the <Text style={{ fontFamily: undefined }}>+</Text> button to
              set a reminder.
            </Text>
          </View>
        )}

        {!isLoading && hasAny && (
          <View style={styles.sections}>
            {groups.overdue.length > 0 && (
              <Section title="Overdue" overdue>
                {groups.overdue.map((item, i) => (
                  <FollowUpRow
                    key={item.id}
                    item={item}
                    group="overdue"
                    onCheck={() => handleComplete(item)}
                    onPress={() => openEdit(item)}
                    isLast={i === groups.overdue.length - 1}
                  />
                ))}
              </Section>
            )}

            {groups.today.length > 0 && (
              <Section title="Today">
                {groups.today.map((item, i) => (
                  <FollowUpRow
                    key={item.id}
                    item={item}
                    group="today"
                    onCheck={() => handleComplete(item)}
                    onPress={() => openEdit(item)}
                    isLast={i === groups.today.length - 1}
                  />
                ))}
              </Section>
            )}

            {groups.upcoming.length > 0 && (
              <Section title="Upcoming">
                {groups.upcoming.map((item, i) => (
                  <FollowUpRow
                    key={item.id}
                    item={item}
                    group="upcoming"
                    onCheck={() => handleComplete(item)}
                    onPress={() => openEdit(item)}
                    isLast={i === groups.upcoming.length - 1}
                  />
                ))}
              </Section>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={openAdd}
        hitSlop={8}
      >
        <IconPlus size={26} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      {/* Add / Edit sheet */}
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sheetTitle}>
            {sheetMode === "add" ? "New reminder" : "Edit reminder"}
          </Text>

          {/* Title */}
          <Text style={styles.fieldLabel}>Title</Text>
          <BottomSheetTextInput
            style={styles.textInput}
            placeholder="What do you need to follow up on?"
            placeholderTextColor="#BBBBBB"
            value={formTitle}
            onChangeText={setFormTitle}
            returnKeyType="done"
            autoFocus={sheetMode === "add"}
          />

          {/* Date / time */}
          <Text style={styles.fieldLabel}>When</Text>
          <View style={styles.dateRow}>
            <Pressable
              style={styles.datePart}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker((v) => !v);
              }}
            >
              <Text style={styles.dateLabel}>Date</Text>
              <Text style={styles.dateValue}>
                {formDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </Pressable>
            <Pressable
              style={styles.datePart}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker((v) => !v);
              }}
            >
              <Text style={styles.dateLabel}>Time</Text>
              <Text style={styles.dateValue}>
                {formDate.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) {
                  setFormDate((prev) => {
                    const next = new Date(selected);
                    next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                    return next;
                  });
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selected) {
                  setFormDate((prev) => {
                    const next = new Date(prev);
                    next.setHours(
                      selected.getHours(),
                      selected.getMinutes(),
                      0,
                      0,
                    );
                    return next;
                  });
                }
              }}
            />
          )}

          {/* Save */}
          <Pressable
            style={[
              styles.saveBtn,
              (!formTitle.trim() || isSaving) && styles.saveBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!formTitle.trim() || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save reminder</Text>
            )}
          </Pressable>

          {/* Delete (edit mode) */}
          {sheetMode === "edit" && (
            <Pressable style={styles.deleteBtn} onPress={handleDeleteFromSheet}>
              <IconTrash size={16} color="#EF4444" strokeWidth={1.75} />
              <Text style={styles.deleteBtnText}>Delete reminder</Text>
            </Pressable>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  overdue,
  children,
}: {
  title: string;
  overdue?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, overdue && styles.sectionTitleOverdue]}
      >
        {title}
      </Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function FollowUpRow({
  item,
  group,
  onCheck,
  onPress,
  isLast,
}: {
  item: FollowUp;
  group: "overdue" | "today" | "upcoming";
  onCheck: () => void;
  onPress: () => void;
  isLast: boolean;
}) {
  const timeColor = group === "overdue" ? "#EF4444" : "#999999";

  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
    >
      {/* Checkbox */}
      <Pressable style={styles.checkboxOuter} onPress={onCheck} hitSlop={12}>
        <View
          style={[
            styles.checkboxInner,
            group === "overdue" && styles.checkboxOverdue,
          ]}
        />
      </Pressable>

      {/* Content */}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.job_application && (
          <Text style={styles.rowApp} numberOfLines={1}>
            {item.job_application.company.name}
            <Text style={{ fontFamily: undefined }}> / </Text>
            {item.job_application.role_title}
          </Text>
        )}
        <View style={styles.rowTimeLine}>
          <IconBell size={12} color={timeColor} strokeWidth={1.75} />
          <Text style={[styles.rowTime, { color: timeColor }]}>
            {" "}
            {formatDue(item.due_at, group)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 24,
    color: "#1a1a2e",
  },
  headerSub: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: color.PRIMARY,
    marginTop: 2,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#EEF9F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 78,
    color: "#1a1a2e",
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    lineHeight: 20,
  },
  sections: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 12,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  sectionTitleOverdue: {
    color: "#EF4444",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  checkboxOverdue: {
    backgroundColor: "#FECACA",
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 15,
    color: "#1a1a2e",
  },
  rowApp: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#999999",
  },
  rowTimeLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  rowTime: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  // Sheet
  sheetHandle: { backgroundColor: "#E0E0E0", width: 36 },
  sheetBg: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 0,
  },
  sheetTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    color: "#1a1a2e",
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 12,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#1a1a2e",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  datePart: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  dateLabel: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 11,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  dateValue: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  saveBtn: {
    backgroundColor: color.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: Hamburg.BOLD,
    fontSize: 15,
    color: "#FFFFFF",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#EF4444",
  },
});
