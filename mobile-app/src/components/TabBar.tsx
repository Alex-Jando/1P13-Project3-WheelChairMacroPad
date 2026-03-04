import { StyleSheet, Text, Pressable, View } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";

export type AppTab = "home" | "devices" | "macros" | "medical";

interface TabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const TABS: Array<{ key: AppTab; label: string }> = [
  { key: "home", label: "Home" },
  { key: "devices", label: "Device" },
  { key: "macros", label: "Macros" },
  { key: "medical", label: "Medical" }
];

export const TabBar = ({ activeTab, onTabChange }: TabBarProps) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            onPress={() => onTabChange(tab.key)}
            style={[styles.tabButton, active && { backgroundColor: `${theme.colors.primary}20` }]}
          >
            <Text
              style={[
                styles.tabLabel,
                { color: active ? theme.colors.primary : theme.colors.tabInactive },
                active && styles.tabLabelActive
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    padding: 6
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "700"
  },
  tabLabelActive: {
    fontWeight: "800"
  }
});
