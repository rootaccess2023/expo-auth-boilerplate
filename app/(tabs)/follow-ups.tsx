import { IconChecklist } from "@tabler/icons-react-native";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Hamburg } from "../../assets/fonts/sharedStyles";

export default function FollowUpsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      alwaysBounceVertical
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={[color.PRIMARY]}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>
          Follow<Text style={{ fontFamily: undefined }}>-</Text>ups
        </Text>
        <Text style={styles.subtitle}>Stay on top of your applications</Text>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <IconChecklist size={36} color={color.PRIMARY} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>No follow-ups yet</Text>
        <Text style={styles.emptyBody}>
          Follow-ups for your applications will appear here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.PRIMARY,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontFamily: Hamburg.BOLD,
    fontSize: 22,
    color: "#1a1a2e",
  },
  subtitle: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: color.PRIMARY,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#EEF9F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
});
