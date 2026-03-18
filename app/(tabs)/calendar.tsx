import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH = "March 2026";

const DAYS_IN_MONTH = 31;
const START_DAY = 6; // March 2026 starts on Sunday (index 6 in Mo-Su layout)

const TODAY = 18;

const EVENT_DAYS: Record<number, string> = {
  18: "Interview",
  19: "Follow-up",
  25: "Deadline",
};

const MOCK_EVENTS = [
  {
    title: "Amazon Interview",
    time: "10:00 AM — Tomorrow",
    icon: "📅",
  },
  {
    title: "Follow-up Google",
    time: "In 2 days",
    icon: "📅",
  },
  {
    title: "Stripe Deadline",
    time: "Mar 25",
    icon: "📅",
  },
];

function buildCalendarGrid(): (number | null)[] {
  const cells: (number | null)[] = Array(START_DAY).fill(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#2A2A2A" },
    "background",
  );
  const grid = buildCalendarGrid();

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: fetch calendar events from API
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {refreshing && (
        <View style={styles.refreshBar}>
          <ActivityIndicator size="small" />
          <ThemedText style={styles.refreshBarText}>Updating...</ThemedText>
        </View>
      )}

      <ThemedText type="title" style={styles.monthTitle}>
        {MONTH}
      </ThemedText>

      <ThemedView style={[styles.calendarCard, { borderColor }]}>
        <View style={styles.weekRow}>
          {DAYS.map((d) => (
            <ThemedText key={d} style={styles.dayHeader}>
              {d}
            </ThemedText>
          ))}
        </View>

        {Array.from({ length: grid.length / 7 }, (_, week) => (
          <View key={week} style={styles.weekRow}>
            {grid.slice(week * 7, week * 7 + 7).map((day, i) => {
              const isToday = day === TODAY;
              const event = day ? EVENT_DAYS[day] : undefined;
              return (
                <View key={`${week}-${i}`} style={styles.dayCell}>
                  {day ? (
                    <>
                      <View
                        style={[
                          styles.dayNumber,
                          isToday && styles.todayCircle,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dayText,
                            isToday && styles.todayText,
                          ]}
                        >
                          {day}
                        </ThemedText>
                      </View>
                      {event && (
                        <View style={styles.eventDot}>
                          <ThemedText style={styles.eventDotText}>
                            ●
                          </ThemedText>
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </ThemedView>

      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">Upcoming Events</ThemedText>
      </View>

      <ThemedView style={[styles.eventsCard, { borderColor }]}>
        {MOCK_EVENTS.map((event, i) => (
          <View
            key={event.title}
            style={[
              styles.eventRow,
              i < MOCK_EVENTS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: borderColor,
              },
            ]}
          >
            <ThemedText style={styles.eventIcon}>{event.icon}</ThemedText>
            <View style={styles.eventInfo}>
              <ThemedText style={styles.eventTitle}>{event.title}</ThemedText>
              <ThemedText style={styles.eventTime}>
                🕒 {event.time}
              </ThemedText>
            </View>
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
  monthTitle: {
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
  calendarCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 28,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.5,
    paddingVertical: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    minHeight: 44,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
  },
  todayCircle: {
    backgroundColor: "#111827",
  },
  todayText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  eventDot: {
    marginTop: 2,
  },
  eventDotText: {
    fontSize: 6,
    color: "#3B82F6",
  },
  sectionHeader: {
    marginBottom: 10,
  },
  eventsCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  eventIcon: {
    fontSize: 22,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 13,
    opacity: 0.5,
  },
});
