import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getJobApplication } from "@/lib/api/job-applications";
import type { JobApplication } from "@/lib/types/job-application";

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Prospect: { bg: "#FEF3C7", text: "#D97706" },
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  Assessment: { bg: "#E0E7FF", text: "#4338CA" },
  Interview: { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
  Archived: { bg: "#E5E7EB", text: "#4B5563" },
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

export default function ApplicationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  useFocusEffect(
    useCallback(() => {
      if (!slug) return;

      (async () => {
        try {
          setLoading(true);
          setError("");
          const data = await getJobApplication(slug);
          setApplication(data.job_application);
        } catch (err: any) {
          setError(err?.error || "Failed to load application.");
        } finally {
          setLoading(false);
        }
      })();
    }, [slug]),
  );

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !application) {
    return (
      <View style={styles.centerState}>
        <ThemedText style={styles.errorText}>
          {error || "Application not found."}
        </ThemedText>
        <Pressable style={styles.retryButton} onPress={() => router.back()}>
          <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const stage = application.stage || "Applied";
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.Applied;

  return (
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
        <DetailRow label="Applied" value={formatDate(application.created_at)} />
        <DetailRow
          label="Last Updated"
          value={formatDate(application.updated_at)}
        />
      </ThemedView>

      {application.job_url ? (
        <Pressable
          style={[styles.linkCard, { borderColor }]}
          onPress={() => Linking.openURL(application.job_url)}
        >
          <ThemedText style={styles.linkIcon}>🔗</ThemedText>
          <View style={styles.linkInfo}>
            <ThemedText style={styles.linkLabel}>Job Posting</ThemedText>
            <ThemedText style={styles.linkUrl} numberOfLines={1}>
              {application.job_url}
            </ThemedText>
          </View>
          <ThemedText style={styles.linkChevron}>›</ThemedText>
        </Pressable>
      ) : null}

      {application.notes ? (
        <ThemedView style={[styles.section, { borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
          <ThemedText style={styles.notes}>{application.notes}</ThemedText>
        </ThemedView>
      ) : null}
    </ScrollView>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
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
  linkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  linkIcon: {
    fontSize: 22,
  },
  linkInfo: {
    flex: 1,
    gap: 2,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  linkUrl: {
    fontSize: 12,
    opacity: 0.4,
  },
  linkChevron: {
    fontSize: 20,
    opacity: 0.3,
  },
  notes: {
    fontSize: 15,
    lineHeight: 22,
  },
});
