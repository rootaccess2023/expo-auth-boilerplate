import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  IconArrowLeft,
  IconBriefcase,
  IconBell,
  IconCalendar,
  IconCheck,
  IconMapPin,
  IconPlus,
  IconRadar,
  IconTrash,
} from "@tabler/icons-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ApplicationStatus,
  StatusChange,
  useApplication,
  useDeleteApplication,
  useUpdateStatus,
} from "@/src/api/job-application";
import {
  FollowUp,
  useCompleteFollowUp,
  useCreateFollowUp,
  useFollowUps,
} from "@/src/api/follow-up";
import {
  cancelFollowUpNotification,
  scheduleFollowUpNotification,
} from "@/src/notifications/follow-ups";
import { color, Hamburg } from "@/assets/fonts/sharedStyles";

const ALL_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "accepted",
  "withdrawn",
];

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved:        "Saved",
  applied:      "Applied",
  screening:    "Screening",
  interviewing: "Interviewing",
  offer:        "Offer",
  rejected:     "Rejected",
  accepted:     "Accepted",
  withdrawn:    "Withdrawn",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  saved:        "#6B7280",
  applied:      "#3B82F6",
  screening:    "#8B5CF6",
  interviewing: "#10B981",
  offer:        "#F59E0B",
  rejected:     "#EF4444",
  accepted:     "#13B9B5",
  withdrawn:    "#9CA3AF",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function defaultFuDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: app, isLoading, isError } = useApplication(slug || undefined);
  const { mutate: updateStatus, isPending } = useUpdateStatus(slug ?? "");
  const { mutate: deleteApplication, isPending: isDeleting } = useDeleteApplication();

  // Follow-ups for this application
  const { data: allFollowUps = [] } = useFollowUps();
  const appFollowUps = useMemo(
    () => allFollowUps.filter((f) => f.job_application?.slug === slug),
    [allFollowUps, slug]
  );
  const { mutate: completeFollowUp } = useCompleteFollowUp();
  const { mutate: createFollowUp, isPending: isCreatingFollowUp } = useCreateFollowUp();

  // Add follow-up sheet
  const addFuSheetRef = useRef<BottomSheetModal>(null);
  const [fuTitle, setFuTitle] = useState("");
  const [fuDate, setFuDate] = useState<Date>(defaultFuDate);
  const [showFuDatePicker, setShowFuDatePicker] = useState(false);
  const [showFuTimePicker, setShowFuTimePicker] = useState(false);

  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    []
  );

  function handleStatusSelect(status: ApplicationStatus) {
    sheetRef.current?.dismiss();
    if (status === app?.status) return;
    updateStatus(status, {
      onError: (err) => {
        Alert.alert("Error", err.message ?? "Could not update status.");
      },
    });
  }

  function handleCompleteFollowUp(fu: FollowUp) {
    completeFollowUp(fu.id, {
      onSuccess: () => {
        cancelFollowUpNotification(fu.id);
      },
    });
  }

  function openAddFollowUp() {
    setFuTitle("");
    setFuDate(defaultFuDate());
    setShowFuDatePicker(false);
    setShowFuTimePicker(false);
    addFuSheetRef.current?.present();
  }

  function handleAddFollowUp() {
    if (!fuTitle.trim() || !slug) return;
    createFollowUp(
      { title: fuTitle.trim(), due_at: fuDate.toISOString(), application_slug: slug },
      {
        onSuccess: (created) => {
          addFuSheetRef.current?.dismiss();
          scheduleFollowUpNotification(created);
        },
      }
    );
  }

  function confirmDelete() {
    if (!slug) return;
    Alert.alert(
      "Delete application",
      "This will permanently delete this application and all its status history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteApplication(slug, {
              onSuccess: () => router.back(),
              onError: () => Alert.alert("Error", "Could not delete application."),
            });
          },
        },
      ]
    );
  }

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={color.PRIMARY} size="large" />
        </View>
      );
    }

    if (isError || !app) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load application.</Text>
        </View>
      );
    }

    const badgeColor = STATUS_COLOR[app.status];
    const changes = app.status_changes ?? [];

    return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.hero}>
          <Text style={styles.heroCompany}>{app.company.name}</Text>
          <Text style={styles.heroRole}>{app.role_title}</Text>
          <View style={styles.badgeRow}>
            <Pressable
              onPress={() => sheetRef.current?.present()}
              style={[styles.badge, { backgroundColor: badgeColor + "22" }]}
              hitSlop={8}
            >
              <Text style={[styles.badgeText, { color: badgeColor }]}>
                {STATUS_LABEL[app.status]}
              </Text>
            </Pressable>
            {isPending && (
              <ActivityIndicator size="small" color={color.PRIMARY} style={styles.savingIndicator} />
            )}
          </View>
        </View>

        {/* Detail rows */}
        <View style={styles.detailCard}>
          {app.applied_on && (
            <DetailRow
              icon={<IconCalendar size={18} color={color.PRIMARY} strokeWidth={1.75} />}
              label="Applied on"
              value={formatDate(app.applied_on)}
            />
          )}
          {app.location && (
            <DetailRow
              icon={<IconMapPin size={18} color={color.PRIMARY} strokeWidth={1.75} />}
              label="Location"
              value={app.location}
            />
          )}
          {app.source && (
            <DetailRow
              icon={<IconRadar size={18} color={color.PRIMARY} strokeWidth={1.75} />}
              label="Source"
              value={app.source}
            />
          )}
          <DetailRow
            icon={<IconBriefcase size={18} color={color.PRIMARY} strokeWidth={1.75} />}
            label="Added"
            value={formatDate(app.created_at)}
          />
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Status history</Text>
          {changes.length === 0 ? (
            <Text style={styles.timelineEmpty}>No status changes yet.</Text>
          ) : (
            changes.map((sc, i) => (
              <TimelineRow key={sc.id} change={sc} isLast={i === changes.length - 1} />
            ))
          )}
        </View>

        {/* Follow-ups */}
        <View style={styles.timelineCard}>
          <View style={styles.fuHeader}>
            <Text style={styles.timelineTitle}>
              Follow<Text style={{ fontFamily: undefined }}>-</Text>ups
            </Text>
            <Pressable onPress={openAddFollowUp} hitSlop={8} style={styles.fuAddBtn}>
              <IconPlus size={16} color={color.PRIMARY} strokeWidth={2.5} />
            </Pressable>
          </View>
          {appFollowUps.length === 0 ? (
            <Text style={styles.timelineEmpty}>No reminders set.</Text>
          ) : (
            appFollowUps.map((fu) => (
              <AppFollowUpRow
                key={fu.id}
                item={fu}
                onComplete={() => handleCompleteFollowUp(fu)}
              />
            ))
          )}
        </View>

        {/* Delete */}
        <Pressable
          style={[styles.deleteAppBtn, isDeleting && styles.deleteAppBtnDisabled]}
          onPress={confirmDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <>
              <IconTrash size={16} color="#EF4444" strokeWidth={1.75} />
              <Text style={styles.deleteAppBtnText}>Delete application</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <IconArrowLeft size={24} color="#FFFFFF" strokeWidth={1.75} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {app ? app.company.name : "Application"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {renderBody()}

      {/* Status picker bottom sheet */}
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Change status</Text>
          {ALL_STATUSES.map((s) => {
            const c = STATUS_COLOR[s];
            const isSelected = s === app?.status;
            return (
              <Pressable
                key={s}
                style={[styles.sheetOption, isSelected && styles.sheetOptionSelected]}
                onPress={() => handleStatusSelect(s)}
              >
                <View style={[styles.sheetBadge, { backgroundColor: c + "22" }]}>
                  <Text style={[styles.sheetBadgeText, { color: c }]}>
                    {STATUS_LABEL[s]}
                  </Text>
                </View>
                {isSelected && (
                  <IconCheck size={18} color={color.PRIMARY} strokeWidth={2} />
                )}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Add follow-up sheet */}
      <BottomSheetModal
        ref={addFuSheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBackground}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView
          style={[styles.sheetContent, { paddingBottom: insets.bottom + 24 }]}
        >
          <Text style={styles.sheetTitle}>New reminder</Text>

          <BottomSheetTextInput
            style={styles.fuInput}
            placeholder="What do you need to follow up on?"
            placeholderTextColor="#BBBBBB"
            value={fuTitle}
            onChangeText={setFuTitle}
            returnKeyType="done"
            autoFocus
          />

          <View style={styles.fuDateRow}>
            <Pressable
              style={styles.fuDatePart}
              onPress={() => {
                setShowFuTimePicker(false);
                setShowFuDatePicker((v) => !v);
              }}
            >
              <Text style={styles.fuDateLabel}>Date</Text>
              <Text style={styles.fuDateValue}>
                {fuDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </Pressable>
            <Pressable
              style={styles.fuDatePart}
              onPress={() => {
                setShowFuDatePicker(false);
                setShowFuTimePicker((v) => !v);
              }}
            >
              <Text style={styles.fuDateLabel}>Time</Text>
              <Text style={styles.fuDateValue}>
                {fuDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </Pressable>
          </View>

          {showFuDatePicker && (
            <DateTimePicker
              value={fuDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowFuDatePicker(Platform.OS === "ios");
                if (selected) {
                  setFuDate((prev) => {
                    const next = new Date(selected);
                    next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                    return next;
                  });
                }
              }}
            />
          )}

          {showFuTimePicker && (
            <DateTimePicker
              value={fuDate}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selected) => {
                setShowFuTimePicker(Platform.OS === "ios");
                if (selected) {
                  setFuDate((prev) => {
                    const next = new Date(prev);
                    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                    return next;
                  });
                }
              }}
            />
          )}

          <Pressable
            style={[
              styles.fuSaveBtn,
              (!fuTitle.trim() || isCreatingFollowUp) && styles.fuSaveBtnDisabled,
            ]}
            onPress={handleAddFollowUp}
            disabled={!fuTitle.trim() || isCreatingFollowUp}
          >
            {isCreatingFollowUp ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.fuSaveBtnText}>Save reminder</Text>
            )}
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function AppFollowUpRow({
  item,
  onComplete,
}: {
  item: FollowUp;
  onComplete: () => void;
}) {
  const dueDate = new Date(item.due_at);
  const isOverdue = dueDate < new Date();
  const timeColor = isOverdue ? "#EF4444" : "#999999";
  const timeStr = dueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  }) + " " + dueDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.fuRow}>
      <Pressable style={styles.fuCheckbox} onPress={onComplete} hitSlop={10}>
        <View style={[styles.fuCheckboxInner, isOverdue && styles.fuCheckboxOverdue]} />
      </Pressable>
      <View style={styles.fuRowBody}>
        <Text style={styles.fuRowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.fuRowTimeLine}>
          <IconBell size={11} color={timeColor} strokeWidth={1.75} />
          <Text style={[styles.fuRowTime, { color: timeColor }]}> {timeStr}</Text>
        </View>
      </View>
    </View>
  );
}

function TimelineRow({ change, isLast }: { change: StatusChange; isLast: boolean }) {
  const from = change.from_status ? STATUS_LABEL[change.from_status] : null;
  const toColor = STATUS_COLOR[change.to_status];

  return (
    <View style={[styles.timelineRow, !isLast && styles.timelineRowBorder]}>
      <View style={styles.timelineDotCol}>
        <View style={[styles.timelineDot, { backgroundColor: toColor }]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTransition}>
          {from ?? <Text style={{ fontFamily: undefined }}>-</Text>}
          <Text style={[styles.timelineArrow, { fontFamily: undefined }]}>{" > "}</Text>
          <Text style={[styles.timelineToStatus, { color: toColor }]}>
            {STATUS_LABEL[change.to_status]}
          </Text>
        </Text>
        <Text style={styles.timelineTime}>{timeAgo(change.changed_at)}</Text>
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: color.PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#888888",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCompany: {
    fontFamily: Hamburg.BOLD,
    fontSize: 22,
    color: "#1a1a2e",
  },
  heroRole: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#555555",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 13,
  },
  savingIndicator: {
    marginLeft: 4,
  },
  detailCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  detailIcon: {
    width: 32,
    alignItems: "center",
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#999999",
  },
  detailValue: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 15,
    color: "#1a1a2e",
  },

  // Timeline
  timelineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 13,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineEmpty: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "#BBBBBB",
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 14,
  },
  timelineRowBorder: {},
  timelineDotCol: {
    alignItems: "center",
    width: 12,
    paddingTop: 3,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "#EEEEEE",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
    paddingBottom: 2,
  },
  timelineTransition: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#333333",
  },
  timelineArrow: {
    color: "#AAAAAA",
  },
  timelineToStatus: {
    fontFamily: Hamburg.BOLD,
  },
  timelineTime: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#AAAAAA",
  },

  // Follow-ups section
  fuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fuAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  fuRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F0F0",
  },
  fuCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  fuCheckboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  fuCheckboxOverdue: {
    backgroundColor: "#FECACA",
  },
  fuRowBody: {
    flex: 1,
    gap: 3,
  },
  fuRowTitle: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  fuRowTimeLine: {
    flexDirection: "row",
    alignItems: "center",
  },
  fuRowTime: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
  },
  // Delete application button
  deleteAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5",
    marginTop: 4,
  },
  deleteAppBtnDisabled: {
    opacity: 0.5,
  },
  deleteAppBtnText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#EF4444",
  },
  // Add follow-up form
  fuInput: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#1a1a2e",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  fuDateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  fuDatePart: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  fuDateLabel: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 11,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fuDateValue: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  fuSaveBtn: {
    backgroundColor: color.PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  fuSaveBtnDisabled: {
    opacity: 0.4,
  },
  fuSaveBtnText: {
    fontFamily: Hamburg.BOLD,
    fontSize: 15,
    color: "#FFFFFF",
  },
  // Bottom sheet
  sheetHandle: {
    backgroundColor: "#E0E0E0",
    width: 36,
  },
  sheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sheetTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 16,
    color: "#1a1a2e",
    marginBottom: 12,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  sheetOptionSelected: {
    backgroundColor: "#F5F5F5",
  },
  sheetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sheetBadgeText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
  },
});
