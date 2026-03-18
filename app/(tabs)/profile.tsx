import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { logout } from "@/lib/api/client";
import { useAuth } from "@/lib/context/AuthContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

type MenuItemProps = {
  icon: string;
  label: string;
  onPress?: () => void;
};

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  const borderColor = useThemeColor({}, "icon");

  return (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: borderColor + "22" }]}
      onPress={onPress}
    >
      <ThemedText style={styles.menuIcon}>{icon}</ThemedText>
      <ThemedText style={styles.menuLabel}>{label}</ThemedText>
      <ThemedText style={styles.menuChevron}>›</ThemedText>
    </Pressable>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ThemedView style={styles.sectionCard}>{children}</ThemedView>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: refresh profile data from API
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      await signOut();
    }
  };

  const placeholder = () =>
    Alert.alert("Coming soon", "This feature is not available yet.");

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

      <ThemedView style={styles.profileCard}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarEmoji}>👤</ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="subtitle">{user?.email ?? "User"}</ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </View>
      </ThemedView>

      <MenuSection title="Settings">
        <MenuItem icon="🔔" label="Notifications" onPress={placeholder} />
        <MenuItem icon="🌍" label="Timezone" onPress={placeholder} />
        <MenuItem icon="💼" label="Preferences" onPress={placeholder} />
      </MenuSection>

      <MenuSection title="Account">
        <MenuItem icon="🔑" label="Change Password" onPress={placeholder} />
        <MenuItem icon="📄" label="Terms & Privacy" onPress={placeholder} />
      </MenuSection>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuChevron: {
    fontSize: 20,
    opacity: 0.3,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
