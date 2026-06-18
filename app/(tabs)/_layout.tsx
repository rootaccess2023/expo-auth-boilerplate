import { IconBriefcase, IconChecklist, IconHome, IconNotebook } from "@tabler/icons-react-native";
import { Tabs } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { color, Hamburg } from "../../assets/fonts/sharedStyles";

const ICON_SIZE = 26;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.PRIMARY,
        tabBarInactiveTintColor: "#222222",
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabel: ({ focused, color: tintColor, children }) => (
          <Text
            style={[
              styles.tabBarLabel,
              {
                color: tintColor,
                fontFamily: focused ? Hamburg.MEDIUM : Hamburg.REGULAR,
              },
            ]}
          >
            {children}
          </Text>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconHome
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: "Applications",
          tabBarIcon: ({ color, focused }) => (
            <IconBriefcase
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="follow-ups"
        options={{
          title: "Follow-ups",
          tabBarIcon: ({ color, focused }) => (
            <IconChecklist
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "Prep",
          tabBarIcon: ({ color, focused }) => (
            <IconNotebook
              size={ICON_SIZE}
              color={color}
              strokeWidth={focused ? 2 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.5,
  },
});
