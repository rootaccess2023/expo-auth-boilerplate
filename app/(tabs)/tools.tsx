import {
  IconChevronRight,
  IconFileAnalytics,
  IconLetterCase,
  IconMessages,
  IconTarget,
} from "@tabler/icons-react-native";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Hamburg } from "../../assets/fonts/sharedStyles";

const tools = [
  {
    id: "resume",
    icon: IconFileAnalytics,
    label: "Resume Analyzer",
    description: "Get AI feedback on your resume",
  },
  {
    id: "cover-letter",
    icon: IconLetterCase,
    label: "Cover Letter Writer",
    description: "Generate tailored cover letters",
  },
  {
    id: "interview",
    icon: IconMessages,
    label: "Interview Prep",
    description: "Practice common interview questions",
  },
  {
    id: "job-match",
    icon: IconTarget,
    label: "Job Match Score",
    description: "See how well you fit a role",
  },
] as const;

export default function ToolsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // replace with real data fetch
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
        <Text style={styles.title}>Tools</Text>
        <Text style={styles.subtitle}>Supercharge your job search</Text>
      </View>

      <View style={styles.list}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Pressable
              key={tool.id}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.iconWrap}>
                <Icon size={24} color={color.PRIMARY} strokeWidth={1.5} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{tool.label}</Text>
                <Text style={styles.cardDescription}>{tool.description}</Text>
              </View>
              <IconChevronRight size={18} color="#BBBBBB" strokeWidth={1.5} />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.PRIMARY,
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
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 15,
    color: "#1a1a2e",
  },
  cardDescription: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
});
