import {
  IconBell,
  IconRocket,
  IconSearch,
  IconUser,
} from "@tabler/icons-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
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
const HEADER_BOTTOM_PADDING = 12;
const HEADER_ROW_HEIGHT = 44;
const SEARCH_BAR_HEIGHT = 48;
const SEARCH_TOP_SPACING = 12;
const SEARCH_BOTTOM_SPACING = 16;
const HEADER_RADIUS = 24;

const SAMPLE_SECTIONS = [
  {
    title: "Recommended for you",
    items: [
      "Senior Product Designer at Stripe",
      "Frontend Engineer at Vercel",
      "UX Research Lead at Figma",
    ],
  },
  {
    title: "Recently viewed",
    items: [
      "Mobile Developer at Spotify",
      "Design Systems Engineer at Airbnb",
      "Product Manager at Notion",
    ],
  },
  {
    title: "Popular in your area",
    items: [
      "Software Engineer at Booking.com",
      "Data Analyst at Adyen",
      "Marketing Lead at Mollie",
    ],
  },
];

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
  const headerHeight =
    headerTopPadding + HEADER_ROW_HEIGHT + HEADER_BOTTOM_PADDING;
  const iconColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const titleColor = scrolled ? "#1a1a2e" : "#FFFFFF";
  const subtitleColor = scrolled ? color.PRIMARY : "#FFFFFF";

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // replace with real data fetch
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
          <View style={styles.heroSection}>
            <Text style={styles.heroSectionTitle}>Sample</Text>
          </View>
          <View style={styles.content}>
            {SAMPLE_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item) => (
                  <View key={item} style={styles.card}>
                    <Text style={styles.cardTitle}>{item}</Text>
                    <Text style={styles.cardSubtitle}>
                      Amsterdam · Full-time
                    </Text>
                  </View>
                ))}
              </View>
            ))}
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
            <IconRocket
              size={22}
              color={scrolled ? color.PRIMARY : "#FFFFFF"}
              strokeWidth={1.5}
            />
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
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  heroSectionTitle: {
    fontFamily: Hamburg.BOLD,
    fontSize: 22,
    color: "#FFFFFF",
    lineHeight: 28,
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
    gap: 4,
  },
  cardTitle: {
    fontFamily: Hamburg.MEDIUM,
    fontSize: 15,
    color: "#1a1a2e",
  },
  cardSubtitle: {
    fontFamily: Hamburg.REGULAR,
    fontSize: 13,
    color: "#666666",
  },
});
