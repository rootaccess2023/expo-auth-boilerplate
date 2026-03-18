import { ScrollView, StyleSheet, View } from "react-native";

import { useAuth } from "@/lib/context/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const MOCK_STATS = [
  { label: "Total Apps", value: "24", color: "#3B82F6" },
  { label: "Interviews", value: "5", color: "#8B5CF6" },
  { label: "Offers", value: "1", color: "#10B981" },
  { label: "Rejected", value: "10", color: "#EF4444" },
];

const MOCK_ACTIVE = [
  { company: "Google", role: "SWE", stage: "Interview" },
  { company: "Meta", role: "FE", stage: "Applied" },
  { company: "Stripe", role: "Backend", stage: "Phone Screen" },
];

const MOCK_UPCOMING = [
  { label: "Interview @ Amazon", time: "Tomorrow" },
  { label: "Follow-up @ Stripe", time: "In 2 days" },
];

const MOCK_ATTENTION = [
  { company: "Netflix", days: 10 },
  { company: "Airbnb", days: 7 },
];

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionIcon}>{icon}</ThemedText>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        {title}
      </ThemedText>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const cardBg = useThemeColor(
    { light: "#F9FAFB", dark: "#1E1E1E" },
    "background",
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.greeting}>
        👋 Welcome, {user?.email?.split("@")[0] ?? "there"}
      </ThemedText>

      <View style={styles.statsGrid}>
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </View>

      <SectionHeader icon="🔥" title="Active Applications" />
      <ThemedView style={[styles.card, { borderColor }]}>
        {MOCK_ACTIVE.map((app, i) => (
          <View
            key={app.company}
            style={[
              styles.listRow,
              i < MOCK_ACTIVE.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: borderColor,
              },
            ]}
          >
            <ThemedText style={styles.listCompany}>{app.company}</ThemedText>
            <ThemedText style={styles.listRole}>{app.role}</ThemedText>
            <View
              style={[
                styles.stageBadge,
                {
                  backgroundColor:
                    app.stage === "Interview" ? "#DBEAFE" : "#F3F4F6",
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.stageText,
                  {
                    color:
                      app.stage === "Interview" ? "#1D4ED8" : "#6B7280",
                  },
                ]}
              >
                {app.stage}
              </ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>

      <SectionHeader icon="⏰" title="Upcoming" />
      <ThemedView style={[styles.card, { borderColor }]}>
        {MOCK_UPCOMING.map((event, i) => (
          <View
            key={event.label}
            style={[
              styles.eventRow,
              i < MOCK_UPCOMING.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: borderColor,
              },
            ]}
          >
            <ThemedText style={styles.eventLabel}>{event.label}</ThemedText>
            <ThemedText style={styles.eventTime}>🕒 {event.time}</ThemedText>
          </View>
        ))}
      </ThemedView>

      <SectionHeader icon="⚠️" title="Needs Attention" />
      <ThemedView style={[styles.card, { borderColor }]}>
        {MOCK_ATTENTION.map((item, i) => (
          <View
            key={item.company}
            style={[
              styles.eventRow,
              i < MOCK_ATTENTION.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: borderColor,
              },
            ]}
          >
            <ThemedText style={styles.eventLabel}>
              No update: {item.company}
            </ThemedText>
            <ThemedText style={styles.attentionDays}>
              {item.days} days
            </ThemedText>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  listCompany: {
    fontWeight: "700",
    fontSize: 15,
    width: 70,
  },
  listRole: {
    flex: 1,
    fontSize: 14,
    opacity: 0.6,
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 12,
    fontWeight: "600",
  },
  eventRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 4,
  },
  eventLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 13,
    opacity: 0.5,
  },
  attentionDays: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
  },
});
