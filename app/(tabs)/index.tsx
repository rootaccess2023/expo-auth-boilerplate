import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getJobApplications } from "@/lib/api/job-applications";
import { useAuth } from "@/lib/context/AuthContext";
import type { JobApplication } from "@/lib/types/job-application";

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
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getJobApplications();
      setApplications(data.job_applications);
    } catch (err: any) {
      setError(err?.error || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const stats = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter((app) =>
      app.stage.toLowerCase().includes("interview"),
    ).length;
    const offers = applications.filter(
      (app) => app.stage.toLowerCase() === "offer",
    ).length;
    const rejected = applications.filter(
      (app) => app.stage.toLowerCase() === "rejected",
    ).length;

    return [
      { label: "Total Apps", value: String(total), color: "#3B82F6" },
      { label: "Interviews", value: String(interviews), color: "#8B5CF6" },
      { label: "Offers", value: String(offers), color: "#10B981" },
      { label: "Rejected", value: String(rejected), color: "#EF4444" },
    ];
  }, [applications]);

  const activeApplications = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.stage.toLowerCase() !== "rejected" &&
          app.stage.toLowerCase() !== "offer",
      )
      .slice(0, 5);
  }, [applications]);

  const upcoming = useMemo(() => {
    return applications
      .filter((app) => app.stage.toLowerCase().includes("interview"))
      .slice(0, 5)
      .map((app) => ({
        label: `${app.company} interview`,
        time: formatDate(app.updated_at),
      }));
  }, [applications]);

  const needsAttention = useMemo(() => {
    return applications
      .map((app) => ({
        company: app.company,
        days: daysSince(app.updated_at),
      }))
      .filter((item) => item.days >= 7)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [applications]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.greeting}>
        👋 Welcome, {user?.email?.split("@")[0] ?? "there"}
      </ThemedText>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText style={styles.stateText}>Loading dashboard...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={fetchApplications}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </View>

          <SectionHeader icon="🔥" title="Active Applications" />
          <ThemedView style={[styles.card, { borderColor }]}>
            {activeApplications.length === 0 ? (
              <EmptyState text="No active applications yet." />
            ) : (
              activeApplications.map((app, i) => (
                <Pressable
                  key={app.id}
                  onPress={() => router.push(`/applications/${app.slug}`)}
                  style={[
                    styles.listRow,
                    i < activeApplications.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.listCompany}>
                    {app.company}
                  </ThemedText>
                  <ThemedText style={styles.listRole}>
                    {app.job_title}
                  </ThemedText>
                  <View
                    style={[
                      styles.stageBadge,
                      {
                        backgroundColor: app.stage
                          .toLowerCase()
                          .includes("interview")
                          ? "#DBEAFE"
                          : "#F3F4F6",
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.stageText,
                        {
                          color: app.stage.toLowerCase().includes("interview")
                            ? "#1D4ED8"
                            : "#6B7280",
                        },
                      ]}
                    >
                      {app.stage}
                    </ThemedText>
                  </View>
                </Pressable>
              ))
            )}
          </ThemedView>

          <SectionHeader icon="⏰" title="Upcoming" />
          <ThemedView style={[styles.card, { borderColor }]}>
            {upcoming.length === 0 ? (
              <EmptyState text="No upcoming interviews yet." />
            ) : (
              upcoming.map((event, i) => (
                <View
                  key={`${event.label}-${i}`}
                  style={[
                    styles.eventRow,
                    i < upcoming.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.eventLabel}>
                    {event.label}
                  </ThemedText>
                  <ThemedText style={styles.eventTime}>
                    🕒 {event.time}
                  </ThemedText>
                </View>
              ))
            )}
          </ThemedView>

          <SectionHeader icon="⚠️" title="Needs Attention" />
          <ThemedView style={[styles.card, { borderColor }]}>
            {needsAttention.length === 0 ? (
              <EmptyState text="Nothing needs attention right now." />
            ) : (
              needsAttention.map((item, i) => (
                <View
                  key={`${item.company}-${i}`}
                  style={[
                    styles.eventRow,
                    i < needsAttention.length - 1 && {
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
              ))
            )}
          </ThemedView>
        </>
      )}
    </ScrollView>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <ThemedText style={styles.emptyText}>{text}</ThemedText>
    </View>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function daysSince(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
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
    width: 90,
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
  centerState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  stateText: {
    opacity: 0.6,
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "600",
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
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    opacity: 0.6,
    textAlign: "center",
  },
});
