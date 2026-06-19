import {
  IconArrowRight,
  IconBell,
  IconRocket,
  IconSearch,
  IconUser,
} from "@tabler/icons-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  ActivityItem,
  HomeCounts,
  StaleApplication,
  useHomeSummary,
} from "@/src/api/home";
import { ApplicationStatus } from "@/src/api/job-application";

// ─── constants ────────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 8;
const PULL_THRESHOLD = 20;
const HEADER_BOTTOM_PADDING = 12;
const HEADER_ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const SEARCH_TOP_SPACING = 12;
const SEARCH_BOTTOM_SPACING = 16;
const HEADER_RADIUS = 24;

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved:        "Saved",
  applied:      "Applied",
  screening:    "Screening",
  interviewing: "Interviewing",
  offer:        "Offer",
  rejected:     "Rejected",
  accepted:     "Accepted",
  withdrawn:    "Withdrawn",
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  saved:        "#6B7280",
  applied:      "#3B82F6",
  screening:    "#8B5CF6",
  interviewing: "#10B981",
  offer:        "#F59E0B",
  rejected:     "#EF4444",
  accepted:     "#13B9B5",
  withdrawn:    "#9CA3AF",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── hero cards ───────────────────────────────────────────────────────────────

function StaleHeroCard({ app }: { app: StaleApplication }) {
  return (
    <View style={hero.card}>
      <View style={hero.attentionPill}>
        <Text style={hero.attentionLabel}>Needs attention</Text>
      </View>
      <Text style={hero.cardCompany}>{app.company.name}</Text>
      <Text style={hero.cardBody}>
        Quiet for {app.days_since} {app.days_since === 1 ? "day" : "days"}
      </Text>
      <Text style={hero.cardRole} numberOfLines={1}>{app.role_title}</Text>
      <Pressable
        style={hero.ctaButton}
        onPress={() => router.push(`/application/${app.slug}`)}
      >
        <Text style={hero.ctaText}>View application</Text>
        <IconArrowRight size={16} color={color.PRIMARY} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function MomentumHeroCard({ counts }: { counts: HomeCounts }) {
  const inPlay = counts.applied + counts.screening + counts.interviewing + counts.offer;
  return (
    <View style={hero.card}>
      <Text style={hero.momentumNumber}>{counts.total}</Text>
      <Text style={hero.momentumLabel}>
        {counts.total === 1 ? "application" : "applications"} tracked
        {inPlay > 0 ? ` / ${inPlay} in play` : ""}
      </Text>
      <Pressable
        style={hero.ctaButton}
        onPress={() => router.push("/new-application")}
      >
        <Text style={hero.ctaText}>Add another</Text>
        <IconArrowRight size={16} color={color.PRIMARY} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function EmptyHeroCard() {
  return (
    <View style={hero.card}>
      <Text style={hero.emptyTitle}>Let's land{"\n"}your next role</Text>
      <Pressable
        style={hero.emptyButton}
        onPress={() => router.push("/new-application")}
      >
        <Text style={hero.emptyButtonText}>Add your first application</Text>
      </Pressable>
    </View>
  );
}

function LoadingHeroCard() {
  return (
    <View style={[hero.card, hero.cardCenter]}>
      <ActivityIndicator color="rgba(255,255,255,0.7)" size="large" />
    </View>
  );
}

function ErrorHeroCard() {
  return (
    <View style={[hero.card, hero.cardCenter]}>
      <Text style={hero.errorText}>Couldn't load summary</Text>
    </View>
  );
}

// ─── content sub-components ───────────────────────────────────────────────────

function CountChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={chip.container}>
      <Text style={chip.value}>{value}</Text>
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const toColor = STATUS_COLOR[item.to_status];
  const from = item.from_status ? STATUS_LABEL[item.from_status] : null;
  return (
    <Pressable
      style={activity.row}
      onPress={() => router.push(`/application/${item.slug}`)}
    >
      <View style={activity.body}>
        <Text style={activity.company} numberOfLines={1}>{item.company.name}</Text>
        <Text style={activity.transition}>
          {from ?? <Text style={{ fontFamily: undefined }}>-</Text>}
          <Text style={[activity.arrow, { fontFamily: undefined }]}>{" > "}</Text>
          <Text style={[activity.toStatus, { color: toColor }]}>
            {STATUS_LABEL[item.to_status]}
          </Text>
        </Text>
      </View>
      <Text style={activity.time}>{timeAgo(item.changed_at)}</Text>
    </Pressable>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [searchVisible, setSearchVisible] = useState(true);
  const [bounces, setBounces] = useState(true);
  const prevScrollOffsetRef = useRef(0);
  const scrollViewHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const searchAnim = useRef(new Animated.Value(1)).current;

  const { data, isLoading, isError, refetch } = useHomeSummary();

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchVisible ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [searchVisible]);

  const searchContainerHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SEARCH_TOP_SPACING + SEARCH_BAR_HEIGHT],
    extrapolate: "clamp",
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
    extrapolate: "clamp",
  });
  const headerPaddingBottom = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [HEADER_BOTTOM_PADDING, SEARCH_BOTTOM_SPACING],
    extrapolate: "clamp",
  });

  const scrolled = scrollOffset > SCROLL_THRESHOLD;
  const headerTopPadding = insets.top + 8;
  const headerHeight = headerTopPadding + HEADER_ROW_HEIGHT + HEADER_BOTTOM_PADDING;
  const iconColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const titleColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const subtitleColor = scrolled ? color.PRIMARY : "#FFFFFF";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

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
  const searchAreaHeight = SEARCH_TOP_SPACING + SEARCH_BAR_HEIGHT + SEARCH_BOTTOM_SPACING;
  const totalHeaderHeight = headerHeight + searchAreaHeight;
  const topBackdropHeight = totalHeaderHeight + loaderSpace;

  // ── hero ──────────────────────────────────────────────────────────────────

  const renderHero = () => {
    if (isLoading) return <LoadingHeroCard />;
    if (isError || !data) return <ErrorHeroCard />;

    const { counts, stale_applications } = data;

    // TODO: when Interview model exists, an upcoming interview takes top priority here.
    // Render an "Up next: {company} round {n}" card with date/time and quick action.
    // This slot sits above the stale check — insert it here when Interview is available.

    if (stale_applications.length > 0) {
      return <StaleHeroCard app={stale_applications[0]} />;
    }

    if (counts.total > 0) {
      return <MomentumHeroCard counts={counts} />;
    }

    return <EmptyHeroCard />;
  };

  // ── content ───────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (isLoading || isError || !data) return null;

    const { counts, recent_activity } = data;
    const inPlay = counts.applied + counts.screening + counts.interviewing + counts.offer;

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>At a glance</Text>
          <View style={styles.countsRow}>
            <CountChip label="Total" value={counts.total} />
            <CountChip label="This week" value={counts.this_week} />
            <CountChip label="In play" value={inPlay} />
          </View>
        </View>

        {recent_activity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <View style={styles.activityCard}>
              {recent_activity.map((item) => (
                <ActivityRow key={`${item.slug}-${item.changed_at}`} item={item} />
              ))}
            </View>
          </View>
        )}
      </>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────

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
          <View style={styles.heroSection}>
            {renderHero()}
          </View>
          <View style={styles.content}>
            {renderContent()}
          </View>
        </View>
      </ScrollView>

      {loaderSpace > 0 && (
        <View style={[styles.refreshLoader, { top: totalHeaderHeight, height: loaderSpace }]}>
          {showRefreshLoader && <ActivityIndicator color="#FFFFFF" size="large" />}
        </View>
      )}

      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: headerTopPadding,
            paddingBottom: headerPaddingBottom,
            backgroundColor: scrolled ? "#FFFFFF" : color.PRIMARY,
            borderBottomWidth: 0,
            ...(scrolled && styles.headerScrolled),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandIcon}>
            <IconRocket size={22} color={scrolled ? color.PRIMARY : "#FFFFFF"} strokeWidth={1.5} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: titleColor }]}>NextRole</Text>
            <Text style={[styles.subtitle, { color: subtitleColor }]}>
              Find your next role
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} hitSlop={8}>
              <IconBell size={24} color={iconColor} strokeWidth={1.5} />
            </Pressable>
            <Pressable style={styles.actionButton} hitSlop={8}>
              <IconUser size={24} color={iconColor} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        <Animated.View
          style={{ height: searchContainerHeight, opacity: searchOpacity, overflow: "hidden" }}
        >
          <View style={styles.searchBarInHeader}>
            <IconSearch size={30} color="#222222" strokeWidth={1.5} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search roles, companies..."
              placeholderTextColor="#999999"
              returnKeyType="search"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const hero = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 16,
  },
  cardCenter: {
    alignItems: "center",
  },
  attentionPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  attentionLabel: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 12,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  cardCompany: {
    fontFamily: Hamburg.BOLD,
    fontSize: 24,
    color: "#FFFFFF",
    lineHeight: 30,
  },
  cardBody: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
  },
  cardRole: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 13,
    color: color.PRIMARY,
  },
  momentumNumber: {
    fontFamily: Hamburg.BOLD,
    fontSize: 52,
    color: "#FFFFFF",
    lineHeight: 58,
  },
  momentumLabel: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
  },
  emptyTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 26,
    color: "#FFFFFF",
    lineHeight: 34,
  },
  emptyButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: color.PRIMARY,
  },
  errorText: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
  },
});

const chip = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontFamily: Hamburg.BOLD,
    fontSize: 24,
    color: "#1a1a2e",
  },
  label: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 11,
    color: "#999999",
    textAlign: "center",
  },
});

const activity = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  company: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 14,
    color: "#1a1a2e",
  },
  transition: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: "#666666",
  },
  arrow: {
    color: "#CCCCCC",
  },
  toStatus: {
    fontFamily: Hamburg.MEDIUM,
  },
  time: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 12,
    color: "#AAAAAA",
    marginLeft: 8,
  },
});

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
  brandIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    marginLeft: 12,
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
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    padding: 2,
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
    height: 280,
    borderBottomLeftRadius: HEADER_RADIUS,
    borderBottomRightRadius: HEADER_RADIUS,
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  heroShell: {
    flexGrow: 1,
    minHeight: "100%",
    backgroundColor: "#FFFFFF",
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
  countsRow: {
    flexDirection: "row",
    gap: 10,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
