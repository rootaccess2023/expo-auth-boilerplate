import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendar,
  IconCheck,
  IconMapPin,
  IconRadar,
} from "@tabler/icons-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useRef } from "react";
import {
  ApplicationStatus,
  StatusChange,
  useApplication,
  useUpdateStatus,
} from "@/src/api/job-application";
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

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: app, isLoading, isError } = useApplication(slug || undefined);
  const { mutate: updateStatus, isPending } = useUpdateStatus(slug ?? "");

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
