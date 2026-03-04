# ESP32 Wheelchair Macro Pad Firmware (`esp32-firmware`)

Arduino C++ firmware for ESP32 that reads a resistor-ladder macro pad on one analog pin and notifies button events over BLE.

## Firmware Behavior
- Reads one ADC pin (`GPIO34`) at ~66 Hz (`15 ms` interval).
- Converts ADC raw -> voltage using:
  - `measuredV = (raw / ADC_MAX) * VREF`
  - `ADC_MAX = 4095`, `VREF = 3.3`
- Detects nearest target button voltage within tolerance:
  - Button 1: `0.825 V`
  - Button 2: `1.650 V`
  - Button 3: `2.475 V`
  - Tolerance: `+- 0.30 V`
- If multiple targets match, chooses closest voltage.
- Debounce/stability: requires `4 of last 5` samples to confirm state change.
- Sends BLE notify events:
  - `DOWN` on confirmed press
  - `UP` on confirmed release

## BLE Settings
- Device name: `WheelchairMacroPad`
- Service UUID: `6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d201`
- Notify characteristic UUID: `6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d202`
- Payload (2 bytes):
  - `byte0`: buttonId (`1`, `2`, `3`)
  - `byte1`: eventType (`0x01 = DOWN`, `0x00 = UP`)

## Wiring Expectations
Connect resistor-ladder output to `GPIO34` (ADC input-only pin on many ESP32 dev boards), with common GND.

Expected ladder voltages at ADC pin when pressed:
- B1 ~ `0.825V`
- B2 ~ `1.650V`
- B3 ~ `2.475V`

No press should produce a voltage outside all tolerance windows.

## Build/Flash (PlatformIO)
1. Install VS Code + PlatformIO extension, or PlatformIO Core CLI.
2. From this folder:
```bash
cd esp32-firmware
pio run -t upload
```
3. Open serial monitor:
```bash
pio device monitor
```

## Verification Steps
1. Power ESP32 and open serial monitor at `115200`.
2. Confirm startup logs and BLE advertising message.
3. Press each button and verify serial lines show stable detection and notify events.
4. In mobile app, connect to `WheelchairMacroPad` and confirm matching actions trigger.

## Debug Mode
- `DEBUG_SERIAL` is enabled in `src/main.cpp`.
- Set `#define DEBUG_SERIAL 0` to reduce serial output in production.

## Notes
Assumption: board uses a standard ESP32 ADC range with 12-bit reads and ~3.3V reference; calibrate `VREF` if measured hardware differs.
