import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import type { JobApplication } from "@/lib/types/job-application";

const FILTERS = [
  "All",
  "Prospect",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
  "Rejected",
  "Archived",
] as const;

type Filter = (typeof FILTERS)[number];

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  Assessment: { bg: "#E0E7FF", text: "#4338CA" },
  Interview: { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

export default function ApplicationsScreen() {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [applications, setApplications] = useState<JobApplication[]>([]);
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
      const data = await getJobApplications();
      setApplications(data.job_applications);
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.title}>
          Applications
        </ThemedText>

        <Pressable
          style={styles.refreshButton}
          onPress={() => fetchApplications("refresh")}
          disabled={refreshing}
        >
          <ThemedText style={styles.refreshButtonText}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </ThemedText>
        </Pressable>
      </View>

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
                        {stage}
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
    case "assessment":
    case "technical exam":
    case "exam":
      return "Assessment";
    case "interview":
      return "Interview";
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
  headerRow: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {},
  refreshButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
