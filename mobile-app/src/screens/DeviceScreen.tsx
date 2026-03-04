import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import type { BleDevice } from "../ble/useBLE";
import { BLE_DEVICE_NAME } from "../ble/constants";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppTheme } from "../theme/ThemeContext";
import type { ButtonId } from "../types";

interface DeviceScreenProps {
  devices: BleDevice[];
  connectedDevice: BleDevice | null;
  isScanning: boolean;
  isConnecting: boolean;
  errorMessage: string | null;
  simulationModeEnabled: boolean;
  hasNativeBle: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
  onToggleSimulationMode: (enabled: boolean) => void;
  onSimulateButtonPress: (buttonId: ButtonId) => void;
}

const DeviceRow = ({
  item,
  connectedId,
  isConnecting,
  onConnect,
  theme
}: {
  item: BleDevice;
  connectedId?: string;
  isConnecting: boolean;
  onConnect: (deviceId: string) => void;
  theme: ReturnType<typeof useAppTheme>;
}) => {
  const name = item.name || item.localName || "Unnamed BLE Device";
  const isTarget = name === BLE_DEVICE_NAME;

  return (
    <View style={[styles.deviceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: isTarget ? theme.colors.primary : theme.colors.text }]}>
          {name}
        </Text>
        <Text style={[styles.deviceMeta, { color: theme.colors.secondaryText }]}>ID: {item.id}</Text>
        <Text style={[styles.deviceMeta, { color: theme.colors.secondaryText }]}>RSSI: {item.rssi ?? "n/a"}</Text>
      </View>

      <Pressable
        disabled={isConnecting || connectedId === item.id}
        onPress={() => onConnect(item.id)}
        style={[
          styles.connectButton,
          {
            backgroundColor: connectedId === item.id ? `${theme.colors.success}30` : `${theme.colors.primary}20`,
            borderColor: connectedId === item.id ? theme.colors.success : theme.colors.primary
          }
        ]}
      >
        <Text
          style={[
            styles.connectButtonText,
            { color: connectedId === item.id ? theme.colors.success : theme.colors.primary }
          ]}
        >
          {connectedId === item.id ? "Connected" : "Connect"}
        </Text>
      </Pressable>
    </View>
  );
};

export const DeviceScreen = ({
  devices,
  connectedDevice,
  isScanning,
  isConnecting,
  errorMessage,
  simulationModeEnabled,
  hasNativeBle,
  onStartScan,
  onStopScan,
  onConnect,
  onDisconnect,
  onToggleSimulationMode,
  onSimulateButtonPress
}: DeviceScreenProps) => {
  const theme = useAppTheme();

  return (
    <ScreenContainer>
      <View style={[styles.simCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <View style={styles.simHeader}>
          <View style={styles.simTextWrap}>
            <Text style={[styles.simTitle, { color: theme.colors.text }]}>Simulation Mode</Text>
            <Text style={[styles.simBody, { color: theme.colors.secondaryText }]}>
              {simulationModeEnabled
                ? "Enabled for Expo Go UI testing."
                : hasNativeBle
                  ? "Disabled. Native BLE is active."
                  : "Native BLE unavailable in Expo Go."}
            </Text>
          </View>
          <Switch
            onValueChange={onToggleSimulationMode}
            thumbColor={simulationModeEnabled ? theme.colors.primary : "#f4f3f4"}
            trackColor={{ false: "#767577", true: `${theme.colors.primary}88` }}
            value={simulationModeEnabled}
          />
        </View>

        {simulationModeEnabled ? (
          <View style={styles.simButtonsRow}>
            {[1, 2, 3].map((buttonId) => (
              <Pressable
                key={`sim-${buttonId}`}
                onPress={() => onSimulateButtonPress(buttonId as ButtonId)}
                style={[
                  styles.simButton,
                  { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }
                ]}
              >
                <Text style={[styles.simButtonText, { color: theme.colors.primary }]}>Sim Button {buttonId}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          onPress={isScanning ? onStopScan : onStartScan}
          style={[styles.primaryAction, { backgroundColor: `${theme.colors.primary}20`, borderColor: theme.colors.primary }]}
        >
          <Text style={[styles.primaryActionText, { color: theme.colors.primary }]}>
            {isScanning ? "Stop Scan" : "Scan Devices"}
          </Text>
        </Pressable>

        {connectedDevice ? (
          <Pressable
            onPress={onDisconnect}
            style={[styles.primaryAction, { backgroundColor: `${theme.colors.danger}20`, borderColor: theme.colors.danger }]}
          >
            <Text style={[styles.primaryActionText, { color: theme.colors.danger }]}>Disconnect</Text>
          </Pressable>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={[styles.errorCard, { borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}1A` }]}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={[styles.helperText, { color: theme.colors.secondaryText }]}>
        Scanning {isScanning ? "active" : "inactive"}. Connecting {isConnecting ? "in progress" : "idle"}.
      </Text>

      <View style={styles.deviceList}>
        {devices.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.emptyText, { color: theme.colors.secondaryText }]}>No nearby BLE devices yet. Tap Scan Devices.</Text>
          </View>
        ) : (
          devices.map((device) => (
            <DeviceRow
              key={device.id}
              connectedId={connectedDevice?.id}
              isConnecting={isConnecting}
              item={device}
              onConnect={onConnect}
              theme={theme}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  simCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  simHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  simTextWrap: {
    flex: 1,
    paddingRight: 10
  },
  simTitle: {
    fontSize: 18,
    fontWeight: "800"
  },
  simBody: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4
  },
  simButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  simButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 110,
    paddingHorizontal: 12
  },
  simButtonText: {
    fontSize: 15,
    fontWeight: "800"
  },
  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  primaryAction: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 150,
    paddingHorizontal: 14
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: "800"
  },
  helperText: {
    fontSize: 16,
    fontWeight: "600"
  },
  deviceList: {
    gap: 10
  },
  deviceCard: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  deviceInfo: {
    gap: 4
  },
  deviceName: {
    fontSize: 20,
    fontWeight: "800"
  },
  deviceMeta: {
    fontSize: 14,
    fontWeight: "600"
  },
  connectButton: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: "center"
  },
  connectButtonText: {
    fontSize: 17,
    fontWeight: "800"
  },
  errorCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600"
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
