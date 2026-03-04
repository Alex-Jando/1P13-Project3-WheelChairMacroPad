import { AppState, type AppStateStatus, PermissionsAndroid, Platform } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ButtonEvent, ButtonId } from "../types";
import {
  BLE_CHARACTERISTIC_UUID,
  BLE_DEVICE_NAME,
  BLE_SERVICE_UUID,
  EVENT_DOWN,
  EVENT_UP
} from "./constants";
import { decodeBase64ToBytes } from "../utils/base64";

const TARGET_BUTTON_IDS = new Set([1, 2, 3]);
const SCAN_DURATION_MS = 10000;
const SIMULATED_DEVICE_ID = "sim-wheelchair-macro-pad";

export interface BleDevice {
  id: string;
  name?: string | null;
  localName?: string | null;
  rssi?: number | null;
}

interface UseBleOptions {
  simulationModeInitial?: boolean;
}

interface SubscriptionLike {
  remove: () => void;
}

type BleModule = {
  BleManager: new () => BleManagerLike;
};

interface BleManagerLike {
  startDeviceScan: (
    uuids: string[] | null,
    options: { allowDuplicates: boolean },
    listener: (error: unknown, device: unknown) => void
  ) => void;
  stopDeviceScan: () => void;
  connectToDevice: (
    deviceId: string,
    options: { timeout: number; autoConnect: boolean }
  ) => Promise<NativeDeviceLike>;
  onDeviceDisconnected: (
    deviceId: string,
    listener: (error: unknown, disconnectedDevice: NativeDeviceLike | null) => void
  ) => SubscriptionLike;
  cancelDeviceConnection: (deviceId: string) => Promise<void>;
  destroy: () => void;
}

interface NativeDeviceLike {
  id: string;
  name?: string | null;
  localName?: string | null;
  rssi?: number | null;
  discoverAllServicesAndCharacteristics: () => Promise<NativeDeviceLike>;
  monitorCharacteristicForService: (
    serviceUuid: string,
    characteristicUuid: string,
    listener: (error: unknown, characteristic: { value?: string | null } | null) => void
  ) => SubscriptionLike;
}

const loadBleModule = (): BleModule | null => {
  try {
    return require("react-native-ble-plx") as BleModule;
  } catch {
    return null;
  }
};

const normalizeDevice = (device: Partial<BleDevice> & { id: string }): BleDevice => ({
  id: device.id,
  name: device.name ?? null,
  localName: device.localName ?? null,
  rssi: typeof device.rssi === "number" ? device.rssi : null
});

const getApiLevel = () => {
  const rawVersion = Platform.Version;
  return typeof rawVersion === "string" ? parseInt(rawVersion, 10) : rawVersion;
};

const requestAndroidPermissions = async (): Promise<boolean> => {
  const apiLevel = getApiLevel();

  if (apiLevel >= 31) {
    const response = await PermissionsAndroid.requestMultiple([
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.ACCESS_FINE_LOCATION"
    ]);

    return (
      response["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
      response["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const location = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return location === PermissionsAndroid.RESULTS.GRANTED;
};

const addUniqueDevice = (list: BleDevice[], device: BleDevice) => {
  const existingIndex = list.findIndex((item) => item.id === device.id);
  if (existingIndex === -1) {
    return [...list, device];
  }

  const next = [...list];
  next[existingIndex] = device;
  return next;
};

const handleNotification = (payloadBase64: string): ButtonEvent | null => {
  const payload = decodeBase64ToBytes(payloadBase64);
  if (payload.length < 2) {
    return null;
  }

  const buttonId = payload[0];
  const eventByte = payload[1];

  if (!TARGET_BUTTON_IDS.has(buttonId)) {
    return null;
  }

  if (eventByte !== EVENT_DOWN && eventByte !== EVENT_UP) {
    return null;
  }

  return {
    buttonId: buttonId as ButtonId,
    eventType: eventByte === EVENT_DOWN ? "DOWN" : "UP",
    timestamp: Date.now()
  };
};

export const useBLE = ({ simulationModeInitial = true }: UseBleOptions = {}) => {
  const bleModuleRef = useRef<BleModule | null>(loadBleModule());
  const managerRef = useRef<BleManagerLike | null>(null);
  const nativeConnectedRef = useRef<NativeDeviceLike | null>(null);

  if (!managerRef.current && bleModuleRef.current) {
    try {
      managerRef.current = new bleModuleRef.current.BleManager();
    } catch {
      managerRef.current = null;
    }
  }

  const disconnectSubscriptionRef = useRef<SubscriptionLike | null>(null);
  const notificationSubscriptionRef = useRef<SubscriptionLike | null>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastConnectedIdRef = useRef<string | null>(null);

  const [simulationModeEnabled, setSimulationModeEnabled] = useState(simulationModeInitial);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BleDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<ButtonEvent | null>(null);

  const hasNativeBle = !!managerRef.current;

  const stopScan = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopDeviceScan();
    }

    setIsScanning(false);

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  }, []);

  const setExpoGoBleUnavailableError = useCallback(() => {
    setErrorMessage(
      "Native BLE is unavailable in Expo Go. Keep Simulation Mode on or use a development build."
    );
  }, []);

  const subscribeToButtonCharacteristic = useCallback((device: NativeDeviceLike) => {
    notificationSubscriptionRef.current?.remove();

    notificationSubscriptionRef.current = device.monitorCharacteristicForService(
      BLE_SERVICE_UUID,
      BLE_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          setErrorMessage("BLE notifications stopped. Try reconnecting.");
          return;
        }

        if (!characteristic || !characteristic.value) {
          return;
        }

        const event = handleNotification(characteristic.value);
        if (event) {
          setLastEvent(event);
        }
      }
    );
  }, []);

  const connectToDevice = useCallback(
    async (deviceId: string, silent = false) => {
      if (simulationModeEnabled) {
        setErrorMessage(null);
        setIsConnecting(true);
        stopScan();

        const simulatedDevice = normalizeDevice({
          id: SIMULATED_DEVICE_ID,
          name: BLE_DEVICE_NAME,
          localName: "Simulator",
          rssi: -40
        });

        setDiscoveredDevices((current) => addUniqueDevice(current, simulatedDevice));

        setTimeout(() => {
          setConnectedDevice(simulatedDevice);
          setIsConnecting(false);
        }, 250);

        return;
      }

      if (!managerRef.current) {
        if (!silent) {
          setExpoGoBleUnavailableError();
        }
        return;
      }

      try {
        setIsConnecting(true);
        setErrorMessage(null);
        stopScan();

        disconnectSubscriptionRef.current?.remove();

        const connected = await managerRef.current.connectToDevice(deviceId, {
          timeout: 10000,
          autoConnect: false
        });

        const ready = await connected.discoverAllServicesAndCharacteristics();

        lastConnectedIdRef.current = ready.id;
        nativeConnectedRef.current = ready;
        setConnectedDevice(normalizeDevice(ready));
        subscribeToButtonCharacteristic(ready);

        disconnectSubscriptionRef.current = managerRef.current.onDeviceDisconnected(
          ready.id,
          (_error, disconnectedDevice) => {
            setConnectedDevice(null);
            nativeConnectedRef.current = null;
            notificationSubscriptionRef.current?.remove();
            notificationSubscriptionRef.current = null;

            if (disconnectedDevice) {
              setDiscoveredDevices((current) =>
                addUniqueDevice(current, normalizeDevice(disconnectedDevice))
              );
            }
          }
        );
      } catch {
        if (!silent) {
          setErrorMessage("Unable to connect. Check power and distance, then try again.");
        }
      } finally {
        setIsConnecting(false);
      }
    },
    [setExpoGoBleUnavailableError, simulationModeEnabled, stopScan, subscribeToButtonCharacteristic]
  );

  const disconnectFromDevice = useCallback(async () => {
    if (!connectedDevice) {
      return;
    }

    if (simulationModeEnabled) {
      setConnectedDevice(null);
      setErrorMessage(null);
      return;
    }

    if (!managerRef.current) {
      setExpoGoBleUnavailableError();
      return;
    }

    try {
      await managerRef.current.cancelDeviceConnection(connectedDevice.id);
    } catch {
      setErrorMessage("Disconnect failed. Please retry.");
    } finally {
      setConnectedDevice(null);
      nativeConnectedRef.current = null;
      notificationSubscriptionRef.current?.remove();
      notificationSubscriptionRef.current = null;
    }
  }, [connectedDevice, setExpoGoBleUnavailableError, simulationModeEnabled]);

  const scanForDevices = useCallback(async () => {
    if (simulationModeEnabled) {
      setErrorMessage(null);
      setDiscoveredDevices([]);
      setIsScanning(true);

      setTimeout(() => {
        setDiscoveredDevices([
          normalizeDevice({
            id: SIMULATED_DEVICE_ID,
            name: BLE_DEVICE_NAME,
            localName: "Simulator",
            rssi: -40
          })
        ]);
        setIsScanning(false);
      }, 500);
      return;
    }

    if (!managerRef.current) {
      setExpoGoBleUnavailableError();
      return;
    }

    if (Platform.OS === "android") {
      const granted = await requestAndroidPermissions();
      if (!granted) {
        setErrorMessage("Bluetooth permissions are required to scan for devices.");
        return;
      }
    }

    setErrorMessage(null);
    setDiscoveredDevices([]);
    setIsScanning(true);

    managerRef.current.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        stopScan();
        setErrorMessage("Scan failed. Toggle Bluetooth and try again.");
        return;
      }

      if (!device || typeof device !== "object") {
        return;
      }

      const maybeDevice = device as Partial<BleDevice> & { id?: string };
      if (!maybeDevice.id) {
        return;
      }

      const normalized = normalizeDevice({
        id: maybeDevice.id,
        name: maybeDevice.name,
        localName: maybeDevice.localName,
        rssi: maybeDevice.rssi
      });

      if (normalized.name === BLE_DEVICE_NAME || normalized.localName === BLE_DEVICE_NAME) {
        setDiscoveredDevices((current) => addUniqueDevice(current, normalized));
        return;
      }

      if (normalized.name || normalized.localName) {
        setDiscoveredDevices((current) => addUniqueDevice(current, normalized));
      }
    });

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      stopScan();
    }, SCAN_DURATION_MS);
  }, [setExpoGoBleUnavailableError, simulationModeEnabled, stopScan]);

  const simulateButtonPress = useCallback(
    (buttonId: ButtonId) => {
      if (!simulationModeEnabled) {
        return;
      }

      setLastEvent({
        buttonId,
        eventType: "DOWN",
        timestamp: Date.now()
      });

      setTimeout(() => {
        setLastEvent({
          buttonId,
          eventType: "UP",
          timestamp: Date.now()
        });
      }, 120);
    },
    [simulationModeEnabled]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state !== "active") {
        stopScan();
        return;
      }

      if (simulationModeEnabled) {
        return;
      }

      if (!connectedDevice && lastConnectedIdRef.current) {
        void connectToDevice(lastConnectedIdRef.current, true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connectToDevice, connectedDevice, simulationModeEnabled, stopScan]);

  useEffect(() => {
    if (!simulationModeEnabled) {
      setConnectedDevice(null);
    }
  }, [simulationModeEnabled]);

  useEffect(() => {
    return () => {
      stopScan();
      notificationSubscriptionRef.current?.remove();
      disconnectSubscriptionRef.current?.remove();
      if (managerRef.current) {
        managerRef.current.destroy();
      }
      nativeConnectedRef.current = null;
    };
  }, [stopScan]);

  return {
    discoveredDevices,
    connectedDevice,
    isScanning,
    isConnecting,
    errorMessage,
    lastEvent,
    simulationModeEnabled,
    hasNativeBle,
    setSimulationModeEnabled,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    simulateButtonPress
  };
};
