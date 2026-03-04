# Wheelchair Macro Pad Mobile App (`mobile-app`)

React Native + Expo + TypeScript app for receiving BLE button events from the ESP32 macro pad and triggering configurable assistive actions.

## Core Features
- BLE central client with `react-native-ble-plx`.
- Home screen with large macro tiles and connection status.
- Device screen for scan/connect/disconnect and RSSI display.
- Macro configuration screen for Button 1/2/3 mappings.
- Local persistence with AsyncStorage.
- High contrast mode toggle.
- Subtle Moti animations (tile press + screen transitions).
- Emergency call safety flow: confirms before opening dialer.

## BLE Protocol (must match firmware)
- Device name: `WheelchairMacroPad`
- Service UUID: `6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d201`
- Notify Characteristic UUID: `6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d202`
- Payload (binary, Base64-encoded by BLE transport):
  - `byte0`: buttonId (`0x01`, `0x02`, `0x03`)
  - `byte1`: eventType (`0x01 = DOWN`, `0x00 = UP`)

## Default Macro Mapping
- Button 1: Emergency Call (911)
- Button 2: Call Caregiver
- Button 3: Send SOS SMS (`I need help. Please call me.`)

Additional selectable actions:
- Loud Alarm Screen
- Share Location
- Open Medical Info
- No Action

## Important Expo BLE Constraint
BLE native modules do **not** run in Expo Go.
Use an Expo Development Build (`expo-dev-client`) on a physical device.
This project is scaffold-compatible with `npx create-expo-app` and uses `app.config.ts` with an Expo config plugin (`withWheelchairBle`) for BLE-related native config.

## Expo Go Simulation Mode (enabled by default)
To support UI testing in Expo Go, the app includes a built-in Simulation Mode:
- Open the `Device` tab.
- Keep `Simulation Mode` ON.
- Tap `Sim Button 1/2/3` to emulate hardware button events and trigger macros.

Notes:
- Simulation Mode does not use real BLE.
- For actual ESP32 BLE scanning/connection/notifications, use a development build.

## Install
```bash
cd mobile-app
npm install
```

## Run with Development Build

### Option 1: Local prebuild + native run
Android:
```bash
npx expo prebuild --platform android
npx expo run:android
```

iOS (macOS + Xcode required):
```bash
npx expo prebuild --platform ios
npx expo run:ios --device
```

### Option 2: EAS development build
```bash
npm install -g eas-cli
cd mobile-app
eas login
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```
Install the build on your phone, then start Metro:
```bash
npx expo start --dev-client
```

## Permissions
- Android 12+ (API 31+): requests `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` at runtime.
- Android 11 and below: requests location permission for BLE scanning compatibility.
- iOS: Bluetooth/location usage strings are set in `app.config.ts` and shown by iOS as needed.

## Action Behavior Notes
- Emergency call opens dialer using `tel:` after explicit in-app confirmation.
- SMS uses `sms:<number>?body=...` (Android) and `sms:<number>&body=...` (iOS).
- Share Location requests location permission and opens share sheet with coordinates + map URL.
- Loud alarm uses `expo-audio` with a looping alarm audio URL and flashing full-screen UI.

Assumption: alarm tone stream uses a hosted sound URL; internet access improves reliability for audio playback.

## Troubleshooting
1. BLE scan shows no target device:
   - Confirm ESP32 firmware is running and advertising `WheelchairMacroPad`.
   - Confirm Bluetooth is ON and app permissions are granted.
2. Android scan fails immediately:
   - Re-check runtime permission prompts (Bluetooth + location on older Android).
   - Toggle Bluetooth and relaunch the app.
3. iOS cannot find device:
   - Use a development build, not Expo Go.
   - Confirm iOS Bluetooth permission was allowed in Settings.
4. Notifications not triggering actions:
   - Ensure UUIDs in app and firmware match exactly.
   - Verify firmware sends two-byte payload (button/event).
5. Alarm screen appears but no sound:
   - Device volume/silent settings may block audio output depending on OS policies.

## Quick Validation
1. Open Device tab and connect to `WheelchairMacroPad`.
2. Press each hardware button.
3. Confirm Home tab receives events and macro actions run.
4. Change mappings in Macros tab and retest.
