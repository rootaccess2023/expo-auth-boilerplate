import { ApplicationStatus, useApplications } from "@/src/api/job-application";
import {
  IconAdjustmentsHorizontal,
  IconArrowsSort,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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
const HEADER_ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const SEARCH_TOP_SPACING = 20;
const SEARCH_BOTTOM_SPACING = 16;
const FILTER_TOP_SPACING = 12;
const FILTER_ROW_HEIGHT = 40;
const HEADER_RADIUS = 24;

type SortOption = "newest" | "oldest" | "az" | "za";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az",     label: "A → Z" },
  { value: "za",     label: "Z → A" },
];

const FILTER_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];

const SEARCH_ONLY_HEIGHT = SEARCH_TOP_SPACING + SEARCH_BAR_HEIGHT;
const FILTER_BLOCK_HEIGHT = FILTER_TOP_SPACING + FILTER_ROW_HEIGHT;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
  withdrawn: "Withdrawn",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  saved: "#6B7280",
  applied: "#3B82F6",
  screening: "#8B5CF6",
  interviewing: "#10B981",
  offer: "#F59E0B",
  rejected: "#EF4444",
  accepted: "#13B9B5",
  withdrawn: "#9CA3AF",
};

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [searchVisible, setSearchVisible] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [bounces, setBounces] = useState(true);
  const prevScrollOffsetRef = useRef(0);
  const scrollViewHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const searchAnim = useRef(new Animated.Value(1)).current;

  const { data: applications, isLoading, isError, refetch } = useApplications();

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchVisible ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [searchAnim, searchVisible]);

  const searchContainerHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEARCH_ONLY_HEIGHT],
    extrapolate: "clamp",
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });

  const scrolled = scrollOffset > SCROLL_THRESHOLD;
  const headerTopPadding = insets.top + 8;
  const collapsedHeaderHeight =
    headerTopPadding + HEADER_ROW_HEIGHT + SEARCH_BOTTOM_SPACING + FILTER_BLOCK_HEIGHT;
  const expandedHeaderHeight = collapsedHeaderHeight + SEARCH_ONLY_HEIGHT;
  const animatedHeaderHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedHeaderHeight, expandedHeaderHeight],
    extrapolate: "clamp",
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const delta = offsetY - prevScrollOffsetRef.current;

    const nearBottom =
      offsetY + scrollViewHeightRef.current >= contentHeightRef.current - 50;

    if (offsetY <= SCROLL_THRESHOLD) {
      setSearchVisible(true);
    } else if (delta > 0) {
      setSearchVisible(false);
    } else if (delta < 0 && !nearBottom && offsetY < expandedHeaderHeight) {
      setSearchVisible(true);
    }

    prevScrollOffsetRef.current = offsetY;
    setScrollOffset(offsetY);
    setPullOffset(Math.max(0, -offsetY));
    setBounces(!nearBottom);
  };

  const showRefreshLoader = refreshing || pullOffset > PULL_THRESHOLD;
  const loaderSpace = refreshing
    ? 40
    : Math.min(Math.max(0, pullOffset - 8), 56);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ApplicationStatus, number>> = {};
    applications?.forEach((app) => {
      counts[app.status] = (counts[app.status] ?? 0) + 1;
    });
    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    const filtered = selectedStatus
      ? applications.filter((app) => app.status === selectedStatus)
      : applications;
    return [...filtered].sort((a, b) => {
      if (sortOption === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOption === "az") return a.company.name.localeCompare(b.company.name);
      return b.company.name.localeCompare(a.company.name);
    });
  }, [applications, selectedStatus, sortOption]);

  function cycleSort() {
    const idx = SORT_OPTIONS.findIndex((o) => o.value === sortOption);
    setSortOption(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].value);
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={color.PRIMARY} size="large" />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Could not load applications</Text>
          <Text style={styles.stateBody}>Pull down to try again.</Text>
        </View>
      );
    }

    if (!applications || applications.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No applications yet</Text>
          <Text style={styles.stateBody}>Tap + to add one.</Text>
        </View>
      );
    }

    if (filteredApplications.length === 0) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>No matching applications</Text>
          <Text style={styles.stateBody}>Try a different filter.</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your applications</Text>
        {filteredApplications.map((app) => {
          const badgeColor = STATUS_COLOR[app.status];
          return (
            <Pressable
              key={app.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => router.push(`/application/${app.slug}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardCompany}>{app.company.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: badgeColor + "20" },
                  ]}
                >
                  <Text style={[styles.statusText, { color: badgeColor }]}>
                    {STATUS_LABEL[app.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardRole}>{app.role_title}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={bounces}
        onLayout={(e) => {
          scrollViewHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_, h) => {
          contentHeightRef.current = h;
        }}
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
        <Animated.View
          style={{
            height: animatedHeaderHeight,
            backgroundColor: "#FFFFFF",
          }}
        />
        <View style={styles.heroShell}>
          <View style={styles.heroSection} />
          <View style={styles.content}>{renderContent()}</View>
        </View>
      </ScrollView>

      {loaderSpace > 0 && (
        <Animated.View
          style={[
            styles.refreshLoader,
            { top: animatedHeaderHeight, height: loaderSpace },
          ]}
        >
          {showRefreshLoader && (
            <ActivityIndicator color={color.PRIMARY} size="large" />
          )}
        </Animated.View>
      )}

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: headerTopPadding,
            paddingBottom: SEARCH_BOTTOM_SPACING,
            ...(scrolled && styles.headerScrolled),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Applications</Text>
            <Text style={styles.subtitle}>Track your progress</Text>
          </View>
        </View>

        <Animated.View
          style={{
            height: searchContainerHeight,
            opacity: searchOpacity,
            overflow: "hidden",
          }}
          pointerEvents={searchVisible ? "auto" : "none"}
        >
          <View style={styles.searchBarInHeader}>
            <IconSearch size={30} color="#222222" strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search applications..."
              placeholderTextColor="#999999"
              returnKeyType="search"
            />
          </View>

        </Animated.View>

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          <Pressable style={styles.filterIconPill} hitSlop={4}>
            <IconAdjustmentsHorizontal
              size={18}
              color="#1a1a2e"
              strokeWidth={2}
            />
          </Pressable>

          <Pressable
            style={[styles.filterChip, sortOption !== "newest" && styles.filterChipActive]}
            onPress={cycleSort}
            hitSlop={4}
          >
            <Text style={[styles.filterChipText, sortOption !== "newest" && styles.filterChipTextActive]}>
              {SORT_OPTIONS.find((o) => o.value === sortOption)!.label}
            </Text>
            <IconArrowsSort size={16} color={sortOption !== "newest" ? "#FFFFFF" : "#1a1a2e"} strokeWidth={2} />
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              selectedStatus === null && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(null)}
            hitSlop={4}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === null && styles.filterChipTextActive,
              ]}
            >
              All {applications?.length ?? 0}
            </Text>
          </Pressable>

          {FILTER_STATUSES.map((status) => {
            const count = statusCounts[status] ?? 0;
            if (count === 0) return null;

            const isActive = selectedStatus === status;
            const statusColor = STATUS_COLOR[status];
            return (
              <Pressable
                key={status}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? statusColor
                      : statusColor + "18",
                  },
                ]}
                onPress={() => setSelectedStatus(isActive ? null : status)}
                hitSlop={4}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? "#FFFFFF" : statusColor },
                  ]}
                >
                  {STATUS_LABEL[status]} {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push("/new-application")}
      >
        <IconPlus size={26} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
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
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: HEADER_ROW_HEIGHT,
  },
  headerScrolled: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
    color: "#1a1a2e",
  },
  subtitle: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    marginTop: 1,
    color: color.PRIMARY,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
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
  filterRow: {
    marginTop: FILTER_TOP_SPACING,
    marginHorizontal: -16,
    height: FILTER_ROW_HEIGHT,
  },
  filterRowContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  filterIconPill: {
    width: FILTER_ROW_HEIGHT,
    height: FILTER_ROW_HEIGHT,
    borderRadius: FILTER_ROW_HEIGHT / 2,
    backgroundColor: color.SURFACE,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: FILTER_ROW_HEIGHT,
    borderRadius: FILTER_ROW_HEIGHT / 2,
    backgroundColor: color.SURFACE,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: "#1a1a2e",
  },
  filterChipText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
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
    paddingBottom: 100,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 8,
  },
  stateTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 16,
    color: "#1a1a2e",
    textAlign: "center",
  },
  stateBody: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
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
    gap: 4,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardCompany: {
    flex: 1,
    fontFamily: Hamburg.BOLD,
    fontSize: 15,
    color: "#1a1a2e",
  },
  cardRole: {
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
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
});
