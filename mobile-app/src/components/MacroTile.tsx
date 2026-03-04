import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiPressable } from "moti/interactions";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";

interface MacroTileProps {
  buttonLabel: string;
  actionLabel: string;
  icon: string;
  onPress: () => void;
}

export const MacroTile = ({ buttonLabel, actionLabel, icon, onPress }: MacroTileProps) => {
  const theme = useAppTheme();

  return (
    <MotiPressable
      onPress={onPress}
      animate={({ pressed }) => ({
        scale: pressed ? 0.97 : 1,
        opacity: pressed ? 0.93 : 1
      })}
      transition={{ type: "timing", duration: 120 }}
      style={[styles.tile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.buttonLabel, { color: theme.colors.secondaryText }]}>{buttonLabel}</Text>
        <MaterialCommunityIcons color={theme.colors.primary} name={icon as never} size={34} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.colors.text }]}>{actionLabel}</Text>
    </MotiPressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 138,
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "700"
  },
  actionLabel: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
    marginTop: 12
  }
});
