import {
  IconChevronDown,
  IconSearch,
} from "@tabler/icons-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Hamburg } from "../../assets/fonts/sharedStyles";

const SCROLL_THRESHOLD = 8;
const PULL_THRESHOLD = 20;
const HEADER_BOTTOM_PADDING = 12;
const HEADER_ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const SEARCH_TOP_SPACING = 12;
const SEARCH_BOTTOM_SPACING = 16;
const HEADER_RADIUS = 24;

const SAMPLE_APPLICATIONS = [
  { company: "Stripe", role: "Senior Product Designer", status: "In review" },
  { company: "Vercel", role: "Frontend Engineer", status: "Applied" },
  { company: "Figma", role: "UX Research Lead", status: "Interview" },
  { company: "Spotify", role: "Mobile Developer", status: "Applied" },
  { company: "Airbnb", role: "Design Systems Engineer", status: "Rejected" },
  { company: "Notion", role: "Product Manager", status: "In review" },
];

const STATUS_COLORS: Record<string, string> = {
  "In review": "#F59E0B",
  Applied: "#6B7280",
  Interview: "#10B981",
  Rejected: "#EF4444",
};

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [searchVisible, setSearchVisible] = useState(true);
  const [bounces, setBounces] = useState(true);
  const prevScrollOffsetRef = useRef(0);
  const scrollViewHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  const scrolled = scrollOffset > SCROLL_THRESHOLD;

  const headerTopPadding = insets.top + 8;
  const headerHeight =
    headerTopPadding + HEADER_ROW_HEIGHT + HEADER_BOTTOM_PADDING;
  const iconColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const titleColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const subtitleColor = scrolled ? color.PRIMARY : "#FFFFFF";

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const delta = offsetY - prevScrollOffsetRef.current;

    if (offsetY <= 0) {
      setSearchVisible(true);
    } else if (delta > 0) {
      setSearchVisible(false);
    } else if (delta < 0) {
      setSearchVisible(true);
    }

    prevScrollOffsetRef.current = offsetY;
    setScrollOffset(offsetY);
    setPullOffset(Math.max(0, -offsetY));

    const nearBottom =
      offsetY + scrollViewHeightRef.current >= contentHeightRef.current - 50;
    setBounces(!nearBottom);
  };

  const showRefreshLoader = refreshing || pullOffset > PULL_THRESHOLD;
  const loaderSpace = refreshing
    ? 40
    : Math.min(Math.max(0, pullOffset - 8), 56);
  const searchAreaHeight =
    SEARCH_TOP_SPACING + SEARCH_BAR_HEIGHT + SEARCH_BOTTOM_SPACING;
  const totalHeaderHeight = headerHeight + searchAreaHeight;
  const topBackdropHeight = totalHeaderHeight + loaderSpace;

  return (
    <View style={styles.container}>
      <View
        style={[styles.topBackdrop, { height: topBackdropHeight }]}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={bounces}
        onLayout={(e) => { scrollViewHeightRef.current = e.nativeEvent.layout.height; }}
        onContentSizeChange={(_, h) => { contentHeightRef.current = h; }}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
          />
        }
      >
        <View style={{ height: totalHeaderHeight, backgroundColor: color.PRIMARY }} />
        <View style={styles.heroShell}>
          <View style={styles.heroSection} />
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your applications</Text>
              {SAMPLE_APPLICATIONS.map((app) => (
                <View key={`${app.company}-${app.role}`} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>{app.role}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[app.status] + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_COLORS[app.status] },
                        ]}
                      >
                        {app.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSubtitle}>{app.company}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {loaderSpace > 0 && (
        <View
          style={[
            styles.refreshLoader,
            {
              top: totalHeaderHeight,
              height: loaderSpace,
            },
          ]}
        >
          {showRefreshLoader && (
            <ActivityIndicator color="#FFFFFF" size="large" />
          )}
        </View>
      )}

      <View
        style={[
          styles.header,
          {
            paddingTop: headerTopPadding,
            paddingBottom: searchVisible
              ? SEARCH_BOTTOM_SPACING
              : HEADER_BOTTOM_PADDING,
            backgroundColor: scrolled ? "#FFFFFF" : color.PRIMARY,
            borderBottomWidth: 0,
            ...(scrolled && styles.headerScrolled),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: titleColor }]}>Applications</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              Track your progress
            </Text>
          </View>

          <Pressable
            style={[
              styles.filterPill,
              {
                borderColor: scrolled
                  ? "#D1D5DB"
                  : "rgba(255, 255, 255, 0.45)",
              },
            ]}
            hitSlop={6}
          >
            <Text style={[styles.filterPillText, { color: iconColor }]}>
              All statuses
            </Text>
            <IconChevronDown size={14} color={iconColor} strokeWidth={2.5} />
          </Pressable>
        </View>

        {searchVisible && (
          <View style={styles.searchBarInHeader}>
            <IconSearch size={30} color="#222222" strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search applications..."
              placeholderTextColor="#999999"
              returnKeyType="search"
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "column",
    paddingHorizontal: 16,
    borderBottomColor: "#E5E5E5",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: HEADER_ROW_HEIGHT,
  },
  headerScrolled: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: Hamburg.BOLD,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    marginTop: 1,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
    backgroundColor: color.PRIMARY,
  },
  topBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: color.PRIMARY,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchBarInHeader: {
    marginTop: SEARCH_TOP_SPACING,
    height: SEARCH_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: color.SURFACE,
    borderRadius: SEARCH_BAR_HEIGHT / 2,
    paddingHorizontal: 16,
    gap: 12,
  },
  heroSection: {
    backgroundColor: color.PRIMARY,
    height: 0,
    borderBottomLeftRadius: HEADER_RADIUS,
    borderBottomRightRadius: HEADER_RADIUS,
    overflow: "hidden",
  },
  refreshLoader: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: color.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "#1a1a2e",
    paddingVertical: 0,
  },
  heroShell: {
    flexGrow: 1,
    minHeight: "100%",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 24,
    gap: 24,
  },
  section: {
    gap: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 16,
    color: "#1a1a2e",
  },
  card: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Hamburg.MEDIUM,
    fontSize: 15,
    color: "#1a1a2e",
  },
  cardSubtitle: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: "#666666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 12,
  },
});
