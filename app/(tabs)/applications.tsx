import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const FILTERS = ["All", "Applied", "Interview", "Offer", "Rejected"] as const;
type Filter = (typeof FILTERS)[number];

const MOCK_APPLICATIONS = [
  { company: "Google", role: "Software Engineer", stage: "Interview", date: "Mar 10", source: "LinkedIn" },
  { company: "Meta", role: "Frontend Engineer", stage: "Applied", date: "Mar 8", source: "Referral" },
  { company: "Amazon", role: "SDE II", stage: "Interview", date: "Mar 5", source: "LinkedIn" },
  { company: "Stripe", role: "Backend Engineer", stage: "Applied", date: "Mar 3", source: "Website" },
  { company: "Netflix", role: "Senior SWE", stage: "Applied", date: "Feb 28", source: "LinkedIn" },
  { company: "Apple", role: "iOS Engineer", stage: "Offer", date: "Feb 20", source: "Recruiter" },
  { company: "Airbnb", role: "Full Stack", stage: "Rejected", date: "Feb 15", source: "LinkedIn" },
  { company: "Uber", role: "Platform Eng", stage: "Rejected", date: "Feb 10", source: "Website" },
];

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  Applied: { bg: "#F3F4F6", text: "#6B7280" },
  Interview: { bg: "#DBEAFE", text: "#1D4ED8" },
  Offer: { bg: "#D1FAE5", text: "#059669" },
  Rejected: { bg: "#FEE2E2", text: "#DC2626" },
};

export default function ApplicationsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );

  const filtered =
    activeFilter === "All"
      ? MOCK_APPLICATIONS
      : MOCK_APPLICATIONS.filter((a) => a.stage === activeFilter);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Applications
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((f) => {
          const active = f === activeFilter;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, active && styles.filterActive]}
              onPress={() => setActiveFilter(f)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {f}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ThemedText style={styles.count}>
        {filtered.length} application{filtered.length !== 1 ? "s" : ""}
      </ThemedText>

      <ThemedView style={[styles.listCard, { borderColor }]}>
        {filtered.map((app, i) => {
          const colors = STAGE_COLORS[app.stage] ?? STAGE_COLORS.Applied;
          return (
            <View
              key={`${app.company}-${app.role}`}
              style={[
                styles.row,
                i < filtered.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: borderColor,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <ThemedText style={styles.company}>{app.company}</ThemedText>
                <ThemedText style={styles.role}>{app.role}</ThemedText>
                <ThemedText style={styles.meta}>
                  {app.source} · {app.date}
                </ThemedText>
              </View>
              <View
                style={[styles.stageBadge, { backgroundColor: colors.bg }]}
              >
                <ThemedText style={[styles.stageText, { color: colors.text }]}>
                  {app.stage}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
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
  },
  stageText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
