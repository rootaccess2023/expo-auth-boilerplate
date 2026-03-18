import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  createApplicationEvent,
  getJobApplication,
  updateJobApplication,
} from "@/lib/api/job-applications";
import type {
  ApplicationEvent,
  CreateApplicationEventPayload,
  JobApplication,
} from "@/lib/types/job-application";

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  "In Process": { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Prospect: ["Applied", "Archived"],
  Applied: ["Add Assessment", "Add Interview", "Rejected", "Archived"],
  "In Process": [
    "Add Assessment",
    "Add Interview",
    "Offer",
    "Rejected",
    "Archived",
  ],
  Offer: ["Archived"],
  Rejected: ["Archived"],
  Archived: [],
};

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  "In Process": { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
  Assessment: { bg: "#E0E7FF", text: "#4338CA" },
  Interview: { bg: "#DBEAFE", text: "#1D4ED8" },
  "Follow Up": { bg: "#F3F4F6", text: "#6B7280" },
  Deadline: { bg: "#FEF3C7", text: "#D97706" },
  Custom: { bg: "#E5E7EB", text: "#4B5563" },
};

const UNDO_TIMEOUT_MS = 8000;

const ACTION_STYLES: Record<string, { bg: string; text: string }> = {
  "Add Assessment": { bg: "#E0E7FF", text: "#4338CA" },
  "Add Interview": { bg: "#DBEAFE", text: "#1D4ED8" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  "In Process": { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

const PRIMARY_ACTION: Record<string, string> = {
  Prospect: "Applied",
  Applied: "Add Assessment",
  "In Process": "Add Interview",
  Offer: "Archived",
  Rejected: "Archived",
};

const DESTRUCTIVE_ACTIONS = new Set(["Rejected", "Archived"]);

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

function EventFormModal({
  visible,
  eventType,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  eventType: "Assessment" | "Interview";
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CreateApplicationEventPayload) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setMeetingUrl("");
    setNotes("");
  };

  const handleSubmit = () => {
    const eventTitle =
      title.trim() || `${eventType}`;

    let starts_at: string | null = null;
    if (date.trim()) {
      const timePart = time.trim() || "09:00";
      starts_at = new Date(`${date.trim()}T${timePart}`).toISOString();
    }

    onSave({
      title: eventTitle,
      event_type: eventType,
      starts_at,
      location: location.trim() || undefined,
      meeting_url: meetingUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      status: "Scheduled",
    });

    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalRoot}
      >
        <View style={styles.modalHeader}>
          <Pressable onPress={handleClose}>
            <ThemedText style={styles.modalCancel}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.modalTitle}>
            Add {eventType}
          </ThemedText>
          <Pressable onPress={handleSubmit} disabled={saving}>
            <ThemedText
              style={[styles.modalSave, saving && { opacity: 0.5 }]}
            >
              {saving ? "Saving..." : "Save"}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalForm}
          keyboardShouldPersistTaps="handled"
        >
          <FormField label="Title">
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={`${eventType} at Company`}
            />
          </FormField>

          <FormField label="Date">
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />
          </FormField>

          <FormField label="Time">
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="14:00"
              keyboardType="numbers-and-punctuation"
            />
          </FormField>

          <FormField label="Location">
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Office / Remote"
            />
          </FormField>

          <FormField label="Meeting URL">
            <TextInput
              style={styles.input}
              value={meetingUrl}
              onChangeText={setMeetingUrl}
              placeholder="https://zoom.us/..."
              autoCapitalize="none"
              keyboardType="url"
            />
          </FormField>

          <FormField label="Notes">
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Preparation notes, interviewer names..."
              multiline
              textAlignVertical="top"
            />
          </FormField>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formField}>
      <ThemedText style={styles.formLabel}>{label}</ThemedText>
      {children}
    </View>
  );
}

function ActionSheet({
  visible,
  actions,
  loading,
  onSelect,
  onClose,
}: {
  visible: boolean;
  actions: string[];
  loading: boolean;
  onSelect: (action: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <View
          style={styles.sheetCard}
          onStartShouldSetResponder={() => true}
        >
          {actions.map((action) => {
            const isDestructive = DESTRUCTIVE_ACTIONS.has(action);
            const actionColor = ACTION_STYLES[action] ?? ACTION_STYLES.Archived;
            return (
              <Pressable
                key={action}
                style={styles.sheetRow}
                onPress={() => {
                  onClose();
                  onSelect(action);
                }}
                disabled={loading}
              >
                <ThemedText
                  style={[
                    styles.sheetRowText,
                    { color: isDestructive ? "#DC2626" : actionColor.text },
                  ]}
                >
                  {action}
                </ThemedText>
              </Pressable>
            );
          })}
          <View style={styles.sheetSeparator} />
          <Pressable style={styles.sheetRow} onPress={onClose}>
            <ThemedText style={styles.sheetCancelText}>Cancel</ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function ApplicationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventModalType, setEventModalType] = useState<
    "Assessment" | "Interview"
  >("Assessment");
  const [savingEvent, setSavingEvent] = useState(false);

  const [undoPreviousStage, setUndoPreviousStage] = useState<string | null>(
    null,
  );
  const [showActionSheet, setShowActionSheet] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearUndoTimer();
  }, []);

  const startUndoTimer = (previousStage: string) => {
    clearUndoTimer();
    setUndoPreviousStage(previousStage);
    undoTimerRef.current = setTimeout(() => {
      setUndoPreviousStage(null);
    }, UNDO_TIMEOUT_MS);
  };

  const loadApplication = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError("");
      const data = await getJobApplication(slug);
      setApplication(data.job_application);
      setEvents(data.events ?? []);
    } catch (err: any) {
      setError(err?.error || "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      loadApplication();
    }, [loadApplication]),
  );

  const stage = normalizeStage(application?.stage || "Applied");
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.Applied;
  const actions = useMemo(() => STATUS_TRANSITIONS[stage] ?? [], [stage]);

  const primaryAction = PRIMARY_ACTION[stage] ?? actions[0] ?? null;
  const secondaryActions = useMemo(
    () => actions.filter((a) => a !== primaryAction),
    [actions, primaryAction],
  );

  const handleAction = async (action: string) => {
    if (!application) return;

    if (action === "Add Assessment" || action === "Add Interview") {
      setEventModalType(
        action === "Add Assessment" ? "Assessment" : "Interview",
      );
      setEventModalVisible(true);
      return;
    }

    const previousStage = stage;

    try {
      setActionLoading(true);
      setUndoPreviousStage(null);
      clearUndoTimer();

      await updateJobApplication(application.slug, { stage: action });

      await createApplicationEvent(application.slug, {
        title: `Moved to ${action}`,
        event_type: "stage_change",
        status: action,
      });

      await loadApplication();
      startUndoTimer(previousStage);
    } catch (err: any) {
      const message =
        err?.error || err?.errors?.join?.(", ") || "Failed to update status.";
      Alert.alert("Update failed", message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!application || !undoPreviousStage) return;

    try {
      setActionLoading(true);
      clearUndoTimer();
      setUndoPreviousStage(null);

      await updateJobApplication(application.slug, {
        stage: undoPreviousStage,
      });

      await createApplicationEvent(application.slug, {
        title: `Reverted to ${undoPreviousStage}`,
        event_type: "stage_change",
        status: undoPreviousStage,
      });

      await loadApplication();
    } catch (err: any) {
      const message =
        err?.error || err?.errors?.join?.(", ") || "Failed to undo.";
      Alert.alert("Undo failed", message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEvent = async (payload: CreateApplicationEventPayload) => {
    if (!application) return;

    try {
      setSavingEvent(true);
      await createApplicationEvent(application.slug, payload);

      if (stage === "Applied") {
        await updateJobApplication(application.slug, {
          stage: "In Process",
        });
      }

      await loadApplication();
      setEventModalVisible(false);
    } catch (err: any) {
      const message =
        err?.error || err?.errors?.join?.(", ") || "Failed to add event.";
      Alert.alert("Error", message);
    } finally {
      setSavingEvent(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !application) {
    return (
      <View style={styles.centerState}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.centerState}>
        <ThemedText style={styles.errorText}>Application not found.</ThemedText>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={[styles.headerCard, { borderColor }]}>
          <ThemedText type="title" style={styles.company}>
            {application.company}
          </ThemedText>
          <ThemedText style={styles.jobTitle}>
            {application.job_title}
          </ThemedText>
          <View style={[styles.stageBadge, { backgroundColor: colors.bg }]}>
            <ThemedText style={[styles.stageText, { color: colors.text }]}>
              {stage}
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={[styles.section, { borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Details</ThemedText>
          <DetailRow label="Location" value={application.location} />
          <DetailRow label="Source" value={application.source} />
          <DetailRow
            label="Created"
            value={formatDate(application.created_at)}
          />
          <DetailRow
            label="Last Updated"
            value={formatDate(application.updated_at)}
          />
          {!!application.job_url && (
            <Pressable
              style={styles.detailLinkRow}
              onPress={() => Linking.openURL(application.job_url)}
            >
              <ThemedText style={styles.detailLabel}>Job Posting</ThemedText>
              <ThemedText style={styles.detailLink} numberOfLines={1}>
                View listing
              </ThemedText>
            </Pressable>
          )}
          {!!application.notes && (
            <View style={styles.notesRow}>
              <ThemedText style={styles.detailLabel}>Notes</ThemedText>
              <ThemedText style={styles.notesText}>
                {application.notes}
              </ThemedText>
            </View>
          )}
        </ThemedView>

        <ThemedView style={[styles.section, { borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Timeline</ThemedText>
          {events.length === 0 ? (
            <ThemedText style={styles.helperText}>
              No events yet.
            </ThemedText>
          ) : (
            <View style={styles.timelineWrap}>
              {events.map((event, index) => {
                const eventType = normalizeEventType(event);
                const eventColors =
                  EVENT_TYPE_COLORS[eventType] ?? EVENT_TYPE_COLORS.Custom;
                return (
                  <View key={event.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          { backgroundColor: eventColors.text },
                        ]}
                      />
                      {index < events.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>
                    <View style={styles.timelineContent}>
                      <View
                        style={[
                          styles.timelineBadge,
                          { backgroundColor: eventColors.bg },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.timelineBadgeText,
                            { color: eventColors.text },
                          ]}
                        >
                          {eventType}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.timelineTitle}>
                        {event.title}
                      </ThemedText>
                      {!!event.status && (
                        <ThemedText style={styles.timelineMeta}>
                          Status: {event.status}
                        </ThemedText>
                      )}
                      {!!event.starts_at && (
                        <ThemedText style={styles.timelineMeta}>
                          {formatDateTime(event.starts_at)}
                        </ThemedText>
                      )}
                      {!!event.location && (
                        <ThemedText style={styles.timelineMeta}>
                          📍 {event.location}
                        </ThemedText>
                      )}
                      {!!event.meeting_url && (
                        <Pressable
                          onPress={() => Linking.openURL(event.meeting_url!)}
                        >
                          <ThemedText style={styles.timelineLink}>
                            🔗 Meeting link
                          </ThemedText>
                        </Pressable>
                      )}
                      {!!event.notes && (
                        <ThemedText style={styles.timelineNotes}>
                          {event.notes}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ThemedView>

      
      </ScrollView>

      {(actions.length > 0 || undoPreviousStage) && (
        <View style={styles.footer}>
          {undoPreviousStage && (
            <View style={styles.undoBar}>
              <ThemedText style={styles.undoText}>
                Stage updated
              </ThemedText>
              <Pressable
                style={styles.undoButton}
                onPress={handleUndo}
                disabled={actionLoading}
              >
                <ThemedText style={styles.undoButtonText}>Undo</ThemedText>
              </Pressable>
            </View>
          )}
          {primaryAction && (
            <View style={styles.footerRow}>
              <Pressable
                style={[
                  styles.primaryCta,
                  {
                    backgroundColor:
                      (ACTION_STYLES[primaryAction] ?? ACTION_STYLES.Archived)
                        .text,
                  },
                  actionLoading && styles.footerButtonDisabled,
                ]}
                onPress={() => handleAction(primaryAction)}
                disabled={actionLoading}
              >
                <ThemedText style={styles.primaryCtaText}>
                  {actionLoading ? "..." : primaryAction}
                </ThemedText>
              </Pressable>

              {secondaryActions.length > 0 && (
                <Pressable
                  style={[
                    styles.moreButton,
                    actionLoading && styles.footerButtonDisabled,
                  ]}
                  onPress={() => setShowActionSheet(true)}
                  disabled={actionLoading}
                >
                  <ThemedText style={styles.moreButtonText}>More</ThemedText>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

      <ActionSheet
        visible={showActionSheet}
        actions={secondaryActions}
        loading={actionLoading}
        onSelect={handleAction}
        onClose={() => setShowActionSheet(false)}
      />

      <EventFormModal
        visible={eventModalVisible}
        eventType={eventModalType}
        saving={savingEvent}
        onClose={() => setEventModalVisible(false)}
        onSave={handleSaveEvent}
      />
    </View>
  );
}

function normalizeStage(stage: string) {
  const value = stage?.trim().toLowerCase();
  switch (value) {
    case "prospect":
    case "prospects":
      return "Prospect";
    case "applied":
      return "Applied";
    case "in process":
    case "in_process":
    case "process":
      return "In Process";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    default:
      return stage || "Applied";
  }
}

function normalizeEventType(event: ApplicationEvent): string {
  const value = event.event_type?.trim().toLowerCase();

  if (value === "stage_change") {
    const status = event.status?.trim() || "";
    const normalized = normalizeStage(status);
    if (normalized && EVENT_TYPE_COLORS[normalized]) return normalized;
    return "Custom";
  }

  switch (value) {
    case "assessment":
      return "Assessment";
    case "interview":
      return "Interview";
    case "follow up":
    case "follow_up":
      return "Follow Up";
    case "deadline":
      return "Deadline";
    default:
      return "Custom";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 20,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headerCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  company: {
    fontSize: 28,
  },
  jobTitle: {
    fontSize: 17,
    opacity: 0.6,
  },
  stageBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 4,
  },
  stageText: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.5,
  },
  helperText: {
    fontSize: 14,
    opacity: 0.6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    opacity: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  detailLinkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLink: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  notesRow: {
    gap: 6,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.8,
  },
  timelineWrap: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 18,
    gap: 6,
  },
  timelineBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timelineBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  timelineMeta: {
    fontSize: 13,
    opacity: 0.5,
  },
  timelineLink: {
    fontSize: 13,
    color: "#1D4ED8",
    fontWeight: "600",
  },
  timelineNotes: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    paddingHorizontal: 20,
  },
  undoBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
  },
  undoText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  undoButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  undoButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryCta: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryCtaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  moreButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
  },
  moreButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "700",
  },
  footerButtonDisabled: {
    opacity: 0.5,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  sheetRow: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  sheetRowText: {
    fontSize: 17,
    fontWeight: "600",
  },
  sheetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },
  sheetCancelText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 16 : 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  modalCancel: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalSave: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  modalForm: {
    padding: 20,
    gap: 18,
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 100,
  },
});
