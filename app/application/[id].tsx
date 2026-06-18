import { IconArrowLeft, IconBriefcase, IconCalendar, IconMapPin, IconRadar } from "@tabler/icons-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApplicationStatus, useApplication } from "@/src/api/job-application";
import { color, Hamburg } from "@/assets/fonts/sharedStyles";

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

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: slug } = useLocalSearchParams<{ id: string }>();
  const { data: app, isLoading, isError } = useApplication(slug);

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

    return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.hero}>
          <Text style={styles.heroCompany}>{app.company.name}</Text>
          <Text style={styles.heroRole}>{app.role_title}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor + "22" }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {STATUS_LABEL[app.status]}
            </Text>
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
  badge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 13,
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
});
