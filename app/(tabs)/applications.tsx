import { ApplicationStatus, useApplications } from "@/src/api/job-application";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  IconArrowsSort,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react-native";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, Hamburg } from "../../assets/fonts/sharedStyles";
import SortModal, {
  SORT_OPTIONS,
  SortOption,
} from "../application/components/SortModal";

const SCROLL_THRESHOLD = 8;
const PULL_THRESHOLD = 20;
const HEADER_ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const SEARCH_TOP_SPACING = 20;
const SEARCH_BOTTOM_SPACING = 16;
const FILTER_TOP_SPACING = 12;
const FILTER_ROW_HEIGHT = 40;
const HEADER_RADIUS = 24;

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
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [bounces, setBounces] = useState(true);
  const scrollViewHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const sortSheetRef = useRef<BottomSheetModal>(null);
  const searchProgress = useSharedValue(1);
  const prevScrollY = useRef(0);
  const searchVisible = useRef(true);

  const { data: applications, isLoading, isError, refetch } = useApplications();

  const scrolled = scrollOffset > SCROLL_THRESHOLD;
  const headerTopPadding = insets.top + 8;
  const baseHeaderHeight =
    headerTopPadding +
    HEADER_ROW_HEIGHT +
    SEARCH_BOTTOM_SPACING +
    FILTER_BLOCK_HEIGHT;
  const totalHeaderHeight = baseHeaderHeight + SEARCH_ONLY_HEIGHT;

  const spacerStyle = useAnimatedStyle(() => ({
    height: baseHeaderHeight + searchProgress.value * SEARCH_ONLY_HEIGHT,
  }));
  const searchContainerStyle = useAnimatedStyle(() => ({
    height: searchProgress.value * SEARCH_ONLY_HEIGHT,
    opacity: searchProgress.value,
  }));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const prevY = prevScrollY.current;
    prevScrollY.current = offsetY;
    setScrollOffset(offsetY);
    setPullOffset(Math.max(0, -offsetY));
    const nearBottom = offsetY + scrollViewHeightRef.current >= contentHeightRef.current - 50;
    setBounces(!nearBottom);

    let shouldShow: boolean;
    if (offsetY <= SCROLL_THRESHOLD) {
      shouldShow = true;
    } else if (offsetY > prevY + 2) {
      shouldShow = false;
    } else if (offsetY < prevY - 2 && !nearBottom) {
      shouldShow = true;
    } else {
      return;
    }

    if (shouldShow === searchVisible.current) return;
    searchVisible.current = shouldShow;

    searchProgress.value = withTiming(shouldShow ? 1 : 0, {
      duration: 280,
      easing: Easing.inOut(Easing.ease),
    });
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
      if (sortOption === "newest")
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      if (sortOption === "oldest")
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      if (sortOption === "az")
        return a.company.name.localeCompare(b.company.name);
      return b.company.name.localeCompare(a.company.name);
    });
  }, [applications, selectedStatus, sortOption]);

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
        <Animated.View style={[{ backgroundColor: "#FFFFFF" }, spacerStyle]} />
        <View style={styles.heroShell}>
          <View style={styles.heroSection} />
          <View style={styles.content}>{renderContent()}</View>
        </View>
      </ScrollView>

      {loaderSpace > 0 && (
        <View
          style={[
            styles.refreshLoader,
            { top: totalHeaderHeight, height: loaderSpace },
          ]}
        >
          {showRefreshLoader && (
            <ActivityIndicator color={color.PRIMARY} size="large" />
          )}
        </View>
      )}

      <View
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

        <Animated.View style={[{ overflow: 'hidden' }, searchContainerStyle]}>
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
<Pressable
            style={[
              styles.filterChip,
              sortOption !== "newest" && styles.filterChipActive,
            ]}
            onPress={() => sortSheetRef.current?.present()}
            hitSlop={4}
          >
            <Text
              style={[
                styles.filterChipText,
                sortOption !== "newest" && styles.filterChipTextActive,
              ]}
            >
              {SORT_OPTIONS.find((o) => o.value === sortOption)!.label}
            </Text>
            <IconArrowsSort
              size={16}
              color={sortOption !== "newest" ? "#FFFFFF" : "#1a1a2e"}
              strokeWidth={2}
            />
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
      </View>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => router.push("/new-application")}
      >
        <IconPlus size={26} color="#FFFFFF" strokeWidth={2} />
      </Pressable>

      <SortModal
        ref={sortSheetRef}
        sortOption={sortOption}
        onSelect={(opt) => {
          setSortOption(opt);
          sortSheetRef.current?.dismiss();
        }}
      />
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
