import type { ExpoConfig } from "expo/config";
import { type ConfigPlugin, withInfoPlist } from "expo/config-plugins";

const withWheelchairBle: ConfigPlugin = (config) =>
  withInfoPlist(config, (iosConfig) => {
    const modes = new Set(iosConfig.modResults.UIBackgroundModes || []);
    modes.add("bluetooth-central");
    iosConfig.modResults.UIBackgroundModes = Array.from(modes);
    return iosConfig;
  });

const config: ExpoConfig = {
  name: "Wheelchair Macro Pad",
  slug: "wheelchair-macro-pad",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "wheelchairmacro",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.alexjando.wheelchairmacropad",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSBluetoothAlwaysUsageDescription:
        "This app connects to your Wheelchair Macro Pad over Bluetooth.",
      NSBluetoothPeripheralUsageDescription:
        "This app connects to your Wheelchair Macro Pad over Bluetooth.",
      NSLocationWhenInUseUsageDescription:
        "Location is used for SOS location sharing and BLE scanning on older devices."
    }
  },
  android: {
    permissions: [
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION"
    ],
    package: "com.example.wheelchairmacropad"
  },
  plugins: ["expo-dev-client", "expo-location", "expo-audio"],
  extra: {
    eas: {
      projectId: "3e401e95-44b0-4d7a-b58c-0c4d8dda2fff"
    },
    ble: {
      serviceUuid: "6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d201",
      characteristicUuid: "6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d202",
      deviceName: "WheelchairMacroPad"
    }
  }
};

export default withWheelchairBle(config);
