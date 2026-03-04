import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";

interface StatusPillProps {
  label: string;
  tone: "success" | "warning" | "danger";
}

export const StatusPill = ({ label, tone }: StatusPillProps) => {
  const theme = useAppTheme();

  const toneColor =
    tone === "success"
      ? theme.colors.success
      : tone === "warning"
        ? theme.colors.warning
        : theme.colors.danger;

  return (
    <View style={[styles.container, { borderColor: toneColor, backgroundColor: `${toneColor}20` }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dot: {
    borderRadius: 6,
    height: 10,
    width: 10
  },
  label: {
    fontSize: 15,
    fontWeight: "700"
  }
});
