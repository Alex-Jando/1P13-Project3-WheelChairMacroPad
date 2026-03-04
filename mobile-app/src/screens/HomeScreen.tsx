import { StyleSheet, Text, View } from "react-native";

import type { ButtonEvent, ButtonId, MacroMap } from "../types";
import { useAppTheme } from "../theme/ThemeContext";
import { MacroTile } from "../components/MacroTile";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusPill } from "../components/StatusPill";

interface HomeScreenProps {
  macros: MacroMap;
  isConnected: boolean;
  connectedName?: string;
  lastEvent: ButtonEvent | null;
  simulationModeEnabled: boolean;
  onTriggerMacro: (buttonId: ButtonId) => void;
  transientMessage: string | null;
}

export const HomeScreen = ({
  macros,
  isConnected,
  connectedName,
  lastEvent,
  simulationModeEnabled,
  onTriggerMacro,
  transientMessage
}: HomeScreenProps) => {
  const theme = useAppTheme();
  const buttonIds: ButtonId[] = [1, 2, 3];

  return (
    <ScreenContainer>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Connection</Text>
        <StatusPill
          label={isConnected ? `Connected${connectedName ? `: ${connectedName}` : ""}` : "Not Connected"}
          tone={isConnected ? "success" : "warning"}
        />

        {lastEvent ? (
          <Text style={[styles.eventText, { color: theme.colors.secondaryText }]}>
            Last event: Button {lastEvent.buttonId} {lastEvent.eventType}
          </Text>
        ) : null}

        {simulationModeEnabled ? (
          <Text style={[styles.modeText, { color: theme.colors.warning }]}>
            Simulation mode is ON (Expo Go friendly).
          </Text>
        ) : null}
      </View>

      {transientMessage ? (
        <View style={[styles.infoBanner, { borderColor: theme.colors.border, backgroundColor: `${theme.colors.primary}20` }]}>
          <Text style={[styles.infoText, { color: theme.colors.text }]}>{transientMessage}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionLabel, { color: theme.colors.secondaryText }]}>Macro Buttons</Text>

      <View style={styles.tileStack}>
        {buttonIds.map((buttonId) => {
          const action = macros[buttonId];

          return (
            <MacroTile
              key={buttonId}
              actionLabel={action.label}
              buttonLabel={`Button ${buttonId}`}
              icon={action.icon}
              onPress={() => onTriggerMacro(buttonId)}
            />
          );
        })}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  heading: {
    fontSize: 24,
    fontWeight: "800"
  },
  eventText: {
    fontSize: 16,
    fontWeight: "600"
  },
  modeText: {
    fontSize: 15,
    fontWeight: "700"
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "700"
  },
  tileStack: {
    gap: 12
  },
  infoBanner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  infoText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22
  }
});
