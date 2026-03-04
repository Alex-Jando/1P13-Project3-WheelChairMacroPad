import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  LogBox,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { confirmEmergencyCall, executeMacroAction } from "./actions/macroActions";
import { useBLE } from "./ble/useBLE";
import { EmergencyConfirmModal } from "./components/EmergencyConfirmModal";
import { TabBar, type AppTab } from "./components/TabBar";
import {
  defaultMedicalInfo,
  loadStoredSettings,
  saveHighContrast,
  saveMacros,
  saveMedicalInfo
} from "./storage/storage";
import { ThemeProvider, useThemeSettings } from "./theme/ThemeContext";
import { getTheme } from "./theme/theme";
import type { ButtonId, MacroActionConfig, MacroMap, MedicalInfo } from "./types";
import { AlarmScreen } from "./screens/AlarmScreen";
import { DeviceScreen } from "./screens/DeviceScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MacroConfigScreen } from "./screens/MacroConfigScreen";
import { MedicalInfoScreen } from "./screens/MedicalInfoScreen";
import { createDefaultMacroMap } from "./actions/macroActions";

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead."
]);

const AppContent = () => {
  const { highContrast, toggleHighContrast, setHighContrast } = useThemeSettings();
  const theme = getTheme(highContrast);
  const insets = useSafeAreaInsets();

  const ble = useBLE({ simulationModeInitial: true });

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [macros, setMacros] = useState<MacroMap>(createDefaultMacroMap());
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>(defaultMedicalInfo);
  const [alarmVisible, setAlarmVisible] = useState(false);
  const [pendingEmergencyNumber, setPendingEmergencyNumber] = useState<string | null>(null);
  const [transientMessage, setTransientMessage] = useState<string | null>(null);

  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (message: string) => {
    setTransientMessage(message);

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = setTimeout(() => {
      setTransientMessage(null);
      messageTimeoutRef.current = null;
    }, 2800);
  };

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadStoredSettings();
      setMacros(stored.macros);
      setMedicalInfo(stored.medicalInfo);
      setHighContrast(stored.highContrast);
      setIsHydrated(true);
    };

    void hydrate();
  }, [setHighContrast]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveMacros(macros);
  }, [isHydrated, macros]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveMedicalInfo(medicalInfo);
  }, [isHydrated, medicalInfo]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void saveHighContrast(highContrast);
  }, [highContrast, isHydrated]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const runMacro = async (buttonId: ButtonId) => {
    const action = macros[buttonId];

    await executeMacroAction(action, {
      requestEmergencyConfirmation: (phoneNumber) => {
        setPendingEmergencyNumber(phoneNumber || "911");
      },
      openAlarmScreen: () => {
        setAlarmVisible(true);
      },
      openMedicalInfo: () => {
        setActiveTab("medical");
      },
      showMessage
    });
  };

  useEffect(() => {
    if (!ble.lastEvent || ble.lastEvent.eventType !== "DOWN") {
      return;
    }

    void runMacro(ble.lastEvent.buttonId);
  }, [ble.lastEvent]);

  const updateMacro = (buttonId: ButtonId, next: MacroActionConfig) => {
    setMacros((current) => ({
      ...current,
      [buttonId]: next
    }));
  };

  const handleEmergencyConfirm = async () => {
    if (!pendingEmergencyNumber) {
      return;
    }

    const success = await confirmEmergencyCall(pendingEmergencyNumber);
    if (!success) {
      showMessage("Could not open the phone dialer.");
    }

    setPendingEmergencyNumber(null);
  };

  if (!isHydrated) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }
        ]}
      >
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Wheelchair Macro Pad</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>Fast emergency actions</Text>
        </View>

        <View style={styles.contrastWrap}>
          <Text style={[styles.contrastLabel, { color: theme.colors.secondaryText }]}>High Contrast</Text>
          <Switch
            onValueChange={toggleHighContrast}
            thumbColor={highContrast ? theme.colors.primary : "#f4f3f4"}
            trackColor={{ false: "#767577", true: `${theme.colors.primary}88` }}
            value={highContrast}
          />
        </View>
      </View>

      <View style={styles.screenWrap}>
        <MotiView
          animate={{ opacity: 1, translateY: 0 }}
          from={{ opacity: 0, translateY: 12 }}
          key={activeTab}
          style={styles.screen}
          transition={{ duration: 220, type: "timing" }}
        >
          {activeTab === "home" ? (
            <HomeScreen
              connectedName={ble.connectedDevice?.name ?? ble.connectedDevice?.localName ?? undefined}
              isConnected={!!ble.connectedDevice}
              lastEvent={ble.lastEvent}
              macros={macros}
              simulationModeEnabled={ble.simulationModeEnabled}
              onTriggerMacro={(buttonId) => {
                void runMacro(buttonId);
              }}
              transientMessage={transientMessage}
            />
          ) : null}

          {activeTab === "devices" ? (
            <DeviceScreen
              connectedDevice={ble.connectedDevice}
              devices={ble.discoveredDevices}
              errorMessage={ble.errorMessage}
              isConnecting={ble.isConnecting}
              isScanning={ble.isScanning}
              hasNativeBle={ble.hasNativeBle}
              simulationModeEnabled={ble.simulationModeEnabled}
              onConnect={(deviceId) => {
                void ble.connectToDevice(deviceId);
              }}
              onDisconnect={() => {
                void ble.disconnectFromDevice();
              }}
              onStartScan={() => {
                void ble.scanForDevices();
              }}
              onStopScan={ble.stopScan}
              onToggleSimulationMode={ble.setSimulationModeEnabled}
              onSimulateButtonPress={ble.simulateButtonPress}
            />
          ) : null}

          {activeTab === "macros" ? (
            <MacroConfigScreen macros={macros} onChangeMacro={updateMacro} />
          ) : null}

          {activeTab === "medical" ? (
            <MedicalInfoScreen medicalInfo={medicalInfo} onChange={setMedicalInfo} />
          ) : null}
        </MotiView>
      </View>

      <View style={styles.footer}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      <EmergencyConfirmModal
        onCancel={() => setPendingEmergencyNumber(null)}
        onConfirm={() => {
          void handleEmergencyConfirm();
        }}
        phoneNumber={pendingEmergencyNumber || "911"}
        visible={!!pendingEmergencyNumber}
      />

      <AlarmScreen
        onStop={() => {
          setAlarmVisible(false);
          showMessage("Alarm stopped.");
        }}
        visible={alarmVisible}
      />
    </View>
  );
};

const App = () => {
  const [highContrast, setHighContrast] = useState(false);
  const toggleHighContrast = useCallback(() => {
    setHighContrast((current) => !current);
  }, []);

  const themeContextValue = useMemo(
    () => ({
      highContrast,
      toggleHighContrast,
      setHighContrast
    }),
    [highContrast, toggleHighContrast]
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider value={themeContextValue}>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 16
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center"
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "700"
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingTop: 6
  },
  titleWrap: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 170,
    paddingRight: 8
  },
  title: {
    fontSize: 28,
    fontWeight: "900"
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2
  },
  contrastWrap: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 4,
    minWidth: 120
  },
  contrastLabel: {
    fontSize: 13,
    fontWeight: "700"
  },
  screenWrap: {
    flex: 1,
    marginTop: 6
  },
  screen: {
    flex: 1
  },
  footer: {
    paddingBottom: 10,
    paddingTop: 8
  }
});

export default App;
