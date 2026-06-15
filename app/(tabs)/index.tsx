import {
  IconBell,
  IconBuildingStore,
  IconSearch,
  IconTruckDelivery,
  IconUser,
} from "@tabler/icons-react-native";
import { useCallback, useState } from "react";
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

type Mode = "store" | "delivery";

const SCROLL_THRESHOLD = 8;
const PULL_THRESHOLD = 20;
const HEADER_BOTTOM_PADDING = 12;
const SEARCH_BAR_HEIGHT = 48;
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
  const [mode, setMode] = useState<Mode>("store");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const scrolled = scrollOffset > SCROLL_THRESHOLD;

  const headerTopPadding = insets.top + 8;
  const headerHeight = headerTopPadding + 48 + HEADER_BOTTOM_PADDING;
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
    setScrollOffset(offsetY);
    setPullOffset(Math.max(0, -offsetY));
  };

  const showRefreshLoader = refreshing || pullOffset > PULL_THRESHOLD;
  const loaderSpace = refreshing
    ? 40
    : Math.min(Math.max(0, pullOffset - 8), 56);
  const searchAreaHeight = SEARCH_BAR_HEIGHT + SEARCH_BOTTOM_SPACING;
  const loaderTop = headerHeight + searchAreaHeight;
  const topBackdropHeight = loaderTop + loaderSpace;
  // Scrolls up with content, but never moves down below its resting position during pull
  const searchBarTop = headerHeight - Math.max(0, scrollOffset);

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
        alwaysBounceVertical
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
        <View style={{ height: loaderTop }} />
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
              top: loaderTop,
              height: loaderSpace,
            },
          ]}
        >
          {showRefreshLoader && (
            <ActivityIndicator color="#FFFFFF" size="large" />
          )}
        </View>
      )}

      <View style={[styles.searchBarFixed, { top: searchBarTop }]}>
        <IconSearch size={30} color="#222222" strokeWidth={1.5} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search roles, companies..."
          placeholderTextColor="#999999"
          returnKeyType="search"
        />
      </View>

      <View
        style={[
          styles.header,
          {
            paddingTop: headerTopPadding,
            paddingBottom: HEADER_BOTTOM_PADDING,
            backgroundColor: scrolled ? "#FFFFFF" : color.PRIMARY,
            borderBottomWidth: scrolled ? StyleSheet.hairlineWidth : 0,
            ...(scrolled && styles.headerScrolled),
          },
        ]}
      >
        <View style={styles.toggle}>
          <Pressable
            style={[
              styles.toggleOption,
              mode === "store" && styles.toggleOptionActive,
            ]}
            onPress={() => setMode("store")}
          >
            <IconBuildingStore
              size={22}
              color={mode === "store" ? color.PRIMARY : "#555555"}
              strokeWidth={1.5}
            />
          </Pressable>
          <Pressable
            style={[
              styles.toggleOption,
              mode === "delivery" && styles.toggleOptionActive,
            ]}
            onPress={() => setMode("delivery")}
          >
            <IconTruckDelivery
              size={22}
              color={mode === "delivery" ? color.PRIMARY : "#555555"}
              strokeWidth={1.5}
            />
          </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomColor: "#E5E5E5",
  },
  headerScrolled: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 4,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#EBEBEB",
    borderRadius: 12,
    padding: 4,
  },
  toggleOption: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOptionActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
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
    borderBottomLeftRadius: HEADER_RADIUS,
    borderBottomRightRadius: HEADER_RADIUS,
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  searchBarFixed: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9,
    height: SEARCH_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
