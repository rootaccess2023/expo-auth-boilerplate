import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { FollowUp } from "@/src/api/follow-up";

// Call once at app startup before any scheduling.
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Returns true if permission was granted (or already granted).
export async function requestNotificationPermissions(): Promise<boolean> {
  // Android 8+ requires a channel before any notification can appear.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("follow-ups", {
      name: "Follow-up reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#13B9B5",
    });
  }

  const { status: current } = await Notifications.getPermissionsAsync();
  if (current === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Schedule a local notification at the follow-up's due_at.
// Uses the follow-up id as the notification identifier so it can be
// cancelled or rescheduled by that same id later.
// Silently no-ops for past dates (nothing to schedule).
export async function scheduleFollowUpNotification(followUp: FollowUp): Promise<void> {
  const dueDate = new Date(followUp.due_at);
  if (dueDate.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: String(followUp.id),
    content: {
      title: "Follow-up reminder",
      body: followUp.title,
      data: {
        followUpId: followUp.id,
        // If linked to an application the tap routes to its detail screen;
        // otherwise it routes to the Follow-ups tab.
        applicationSlug: followUp.job_application?.slug ?? null,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: dueDate,
    },
  });
}

// Cancel a scheduled notification. Safe to call even if no notification
// is currently scheduled for this id.
export async function cancelFollowUpNotification(id: number): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(String(id));
}
