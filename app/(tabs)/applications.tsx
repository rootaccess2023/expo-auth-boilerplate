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
import type { JobApplication } from "@/lib/types/job-application";

const FILTERS = [
  "All",
  "Prospect",
  "Applied",
  "In Process",
  "Offer",
  "Rejected",
  "Archived",
] as const;

type Filter = (typeof FILTERS)[number];

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  "In Process": { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

export default function ApplicationsScreen() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [applications, setApplications] = useState<JobApplication[]>([]);
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

      const inProcessApps = data.job_applications.filter(
        (app) => app.stage === "In Process",
      );
      const eventResults = await Promise.all(
        inProcessApps.map(async (app) => {
          try {
            const res = await getApplicationEvents(app.slug);
            return res.events.map((event) => ({ event, slug: app.slug }));
          } catch {
            return [];
          }
        }),
      );
      const eventTypeMap: Record<string, string> = {};
      for (const { event, slug } of eventResults.flat()) {
        if (
          event.event_type === "interview" ||
          event.event_type === "assessment"
        ) {
          const existing = eventTypeMap[slug];
          if (!existing || event.event_type === "interview") {
            eventTypeMap[slug] = event.event_type;
          }
        }
      }
      setLatestEventType(eventTypeMap);
    } catch (err: any) {
      setError(err?.error || "Failed to load applications.");
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

  const filtered = useMemo(() => {
    if (activeFilter === "All") return applications;
    return applications.filter(
      (app) => normalizeStage(app.stage) === activeFilter,
    );
  }, [applications, activeFilter]);

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

      <ThemedText type="title" style={styles.title}>
        Applications
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;

          return (
            <Pressable
              key={filter}
              style={[styles.filterChip, active && styles.filterActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <ThemedText
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {filter}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator />
          <ThemedText style={styles.stateText}>
            Loading applications...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchApplications()}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <ThemedText style={styles.count}>
            {filtered.length} application{filtered.length !== 1 ? "s" : ""}
          </ThemedText>

          <ThemedView style={[styles.listCard, { borderColor }]}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>
                  No applications found
                </ThemedText>
                <ThemedText style={styles.emptyText}>
                  Add your first application to see it here.
                </ThemedText>
              </View>
            ) : (
              filtered.map((app, index) => {
                const stage = normalizeStage(app.stage);
                const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.Applied;
                let stageLabel = stage;
                if (
                  stage === "In Process" &&
                  latestEventType[app.slug]
                ) {
                  const subType = latestEventType[app.slug];
                  stageLabel = `In Process - ${subType.charAt(0).toUpperCase() + subType.slice(1)}`;
                }

                return (
                  <Pressable
                    key={app.id}
                    onPress={() => router.push(`/applications/${app.slug}`)}
                    style={[
                      styles.row,
                      index < filtered.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: borderColor,
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <ThemedText style={styles.company}>
                        {app.company}
                      </ThemedText>
                      <ThemedText style={styles.role}>
                        {app.job_title}
                      </ThemedText>
                      <ThemedText style={styles.meta}>
                        {app.source || "Unknown source"} ·{" "}
                        {formatDate(app.created_at)}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.stageBadge,
                        { backgroundColor: colors.bg },
                      ]}
                    >
                      <ThemedText
                        style={[styles.stageText, { color: colors.text }]}
                      >
                        {stageLabel}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ThemedView>
        </>
      )}
    </ScrollView>
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
    case "interview":
    case "assessment":
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

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 16,
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
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  filterActive: {
    backgroundColor: "#111827",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  count: {
    fontSize: 13,
    opacity: 0.5,
    marginBottom: 12,
  },
  listCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  company: {
    fontSize: 16,
    fontWeight: "700",
  },
  role: {
    fontSize: 14,
    opacity: 0.7,
  },
  meta: {
    fontSize: 12,
    opacity: 0.4,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  stageText: {
    fontSize: 12,
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
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    opacity: 0.6,
    textAlign: "center",
  },
});
