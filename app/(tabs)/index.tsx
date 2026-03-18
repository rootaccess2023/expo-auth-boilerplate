import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  getJobApplications,
  getApplicationEvents,
} from "@/lib/api/job-applications";
import { useAuth } from "@/lib/context/AuthContext";
import type {
  ApplicationEvent,
  JobApplication,
} from "@/lib/types/job-application";

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
  const [upcomingEvents, setUpcomingEvents] = useState<
    Array<{ event: ApplicationEvent; application: JobApplication }>
  >([]);
  const [interviewCount, setInterviewCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [latestEventType, setLatestEventType] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  const fetchApplications = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError("");

      const [data] = await Promise.all([
        getJobApplications(),
        mode === "refresh"
          ? new Promise((r) => setTimeout(r, 600))
          : Promise.resolve(),
      ]);
      setApplications(data.job_applications);

      const eventResults = await Promise.all(
        data.job_applications.map(async (app) => {
          try {
            const res = await getApplicationEvents(app.slug);
            return res.events.map((event) => ({ event, application: app }));
          } catch {
            return [];
          }
        }),
      );

      const allEvents = eventResults.flat();

      setInterviewCount(
        allEvents.filter((e) => e.event.event_type === "interview").length,
      );
      setAssessmentCount(
        allEvents.filter((e) => e.event.event_type === "assessment").length,
      );

      const eventTypeMap: Record<string, string> = {};
      for (const { event, application } of allEvents) {
        if (
          event.event_type === "interview" ||
          event.event_type === "assessment"
        ) {
          const existing = eventTypeMap[application.slug];
          if (!existing || event.event_type === "interview") {
            eventTypeMap[application.slug] = event.event_type;
          }
        }
      }
      setLatestEventType(eventTypeMap);

      const now = new Date();
      const upcoming = allEvents
        .filter(
          (item) =>
            item.event.starts_at &&
            new Date(item.event.starts_at) > now &&
            (item.event.event_type === "interview" ||
              item.event.event_type === "assessment"),
        )
        .sort(
          (a, b) =>
            new Date(a.event.starts_at!).getTime() -
            new Date(b.event.starts_at!).getTime(),
        )
        .slice(0, 5);

      setUpcomingEvents(upcoming);
    } catch (err: any) {
      setError(err?.error || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchApplications("initial");
    }, []),
  );

  const stats = useMemo(() => {
    const offers = applications.filter(
      (app) => app.stage.toLowerCase() === "offer",
    ).length;
    const rejected = applications.filter(
      (app) => app.stage.toLowerCase() === "rejected",
    ).length;

    return [
      { label: "Assessments", value: String(assessmentCount), color: "#3B82F6" },
      { label: "Interviews", value: String(interviewCount), color: "#8B5CF6" },
      { label: "Offers", value: String(offers), color: "#10B981" },
      { label: "Rejected", value: String(rejected), color: "#EF4444" },
    ];
  }, [applications, interviewCount, assessmentCount]);

  const activeApplications = useMemo(() => {
    return applications
      .filter(
        (app) =>
          app.stage.toLowerCase() !== "rejected" &&
          app.stage.toLowerCase() !== "offer",
      )
      .slice(0, 5);
  }, [applications]);

  const needsAttention = useMemo(() => {
    return applications
      .filter((app) => {
        const stage = app.stage.toLowerCase();
        return stage !== "rejected" && stage !== "archived" && stage !== "offer";
      })
      .map((app) => ({
        company: app.company,
        slug: app.slug,
        days: daysSince(app.updated_at),
        stage: app.stage,
      }))
      .filter((item) => item.days >= 7)
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [applications]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchApplications("refresh")}
        />
      }
    >
      {refreshing && (
        <View style={styles.refreshBar}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.refreshBarText}>Updating...</ThemedText>
        </View>
      )}

      <ThemedText type="title" style={styles.greeting}>
        👋 Welcome, {user?.email?.split("@")[0] ?? "there"}
      </ThemedText>

      {loading && !refreshing ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText style={styles.stateText}>Loading dashboard...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable style={styles.retryButton} onPress={() => fetchApplications()}>
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
              activeApplications.map((app, i) => {
                const stageColors = getStageColors(app.stage);
                let stageLabel = app.stage;
                if (app.stage === "In Process" && latestEventType[app.slug]) {
                  const subType = latestEventType[app.slug];
                  stageLabel = `In Process - ${subType.charAt(0).toUpperCase() + subType.slice(1)}`;
                }

                return (
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
                        { backgroundColor: stageColors.bg },
                      ]}
                    >
                      <ThemedText
                        style={[styles.stageText, { color: stageColors.text }]}
                      >
                        {stageLabel}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ThemedView>

          <SectionHeader icon="⏰" title="Upcoming" />
          <ThemedView style={[styles.card, { borderColor }]}>
            {upcomingEvents.length === 0 ? (
              <EmptyState text="No upcoming interviews or assessments." />
            ) : (
              upcomingEvents.map((item, i) => (
                <Pressable
                  key={item.event.id}
                  onPress={() =>
                    router.push(`/applications/${item.application.slug}`)
                  }
                  style={[
                    styles.eventRow,
                    i < upcomingEvents.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <ThemedText style={styles.eventLabel}>
                    📅 {item.application.company} –{" "}
                    {item.event.title || item.event.event_type}
                  </ThemedText>
                  <ThemedText style={styles.eventTime}>
                    🕒 {formatRelativeDate(item.event.starts_at!)}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </ThemedView>

          <SectionHeader icon="⚠️" title="Needs Attention" />
          <ThemedView style={[styles.card, { borderColor }]}>
            {needsAttention.length === 0 ? (
              <EmptyState text="Nothing needs attention right now." />
            ) : (
              needsAttention.map((item, i) => (
                <Pressable
                  key={`${item.company}-${i}`}
                  onPress={() => router.push(`/applications/${item.slug}`)}
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
                  <ThemedText style={styles.attentionMeta}>
                    {item.stage} · {item.days} days ago
                  </ThemedText>
                </Pressable>
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

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  "In Process": { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

function getStageColors(stage: string) {
  return STAGE_COLORS[stage] ?? { bg: "#F3F4F6", text: "#6B7280" };
}

function formatRelativeDate(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffDays <= 0) return `Today at ${time}`;
  if (diffDays === 1) return `Tomorrow at ${time}`;
  if (diffDays <= 7) return `In ${diffDays} days`;
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
  refreshBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  refreshBarText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
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
  attentionMeta: {
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
