#include <Arduino.h>
#include <NimBLEDevice.h>

#define DEBUG_SERIAL 1

constexpr uint8_t ADC_PIN = 34;
constexpr uint16_t ADC_MAX = 4095;
constexpr float VREF = 3.3f;

constexpr float BUTTON_1_V = 0.825f;
constexpr float BUTTON_2_V = 1.650f;
constexpr float BUTTON_3_V = 2.475f;
constexpr float BUTTON_TOL = 0.30f;

constexpr uint8_t HISTORY_SIZE = 5;
constexpr uint8_t REQUIRED_STABLE_COUNT = 4;
constexpr uint32_t SAMPLE_INTERVAL_MS = 15;

constexpr uint8_t EVENT_UP = 0x00;
constexpr uint8_t EVENT_DOWN = 0x01;

const char *DEVICE_NAME = "WheelchairMacroPad";
const char *SERVICE_UUID = "6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d201";
const char *CHAR_UUID = "6f5d0f4e-6be6-4dd2-a9fd-3e20f8a8d202";

NimBLECharacteristic *buttonCharacteristic = nullptr;
bool deviceConnected = false;

uint8_t sampleHistory[HISTORY_SIZE] = {0};
uint8_t historyIndex = 0;
uint8_t historyCount = 0;
uint8_t stableButton = 0;

uint32_t lastSampleTime = 0;

#if DEBUG_SERIAL
uint16_t lastRaw = 0;
float lastVoltage = 0.0f;
uint8_t lastCandidate = 0;
uint32_t lastDebugPrint = 0;
#endif

class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer *server) override {
    deviceConnected = true;
#if DEBUG_SERIAL
    Serial.println("BLE client connected");
#endif
  }

  void onDisconnect(NimBLEServer *server) override {
    deviceConnected = false;
#if DEBUG_SERIAL
    Serial.println("BLE client disconnected. Restarting advertising...");
#endif
    NimBLEDevice::startAdvertising();
  }
};

float readVoltage() {
  const uint16_t raw = analogRead(ADC_PIN);
  const float measuredV = (static_cast<float>(raw) / static_cast<float>(ADC_MAX)) * VREF;

#if DEBUG_SERIAL
  lastRaw = raw;
  lastVoltage = measuredV;
#endif

  return measuredV;
}

uint8_t detectButtonByVoltage(float measuredV) {
  const float targets[3] = {BUTTON_1_V, BUTTON_2_V, BUTTON_3_V};

  uint8_t bestButton = 0;
  float bestDiff = 99.0f;

  for (uint8_t i = 0; i < 3; i++) {
    const float diff = fabsf(measuredV - targets[i]);
    if (diff <= BUTTON_TOL && diff < bestDiff) {
      bestDiff = diff;
      bestButton = i + 1;
    }
  }

#if DEBUG_SERIAL
  lastCandidate = bestButton;
#endif

  return bestButton;
}

void addHistorySample(uint8_t candidate) {
  sampleHistory[historyIndex] = candidate;
  historyIndex = (historyIndex + 1) % HISTORY_SIZE;

  if (historyCount < HISTORY_SIZE) {
    historyCount++;
  }
}

uint8_t getStableCandidate() {
  if (historyCount < HISTORY_SIZE) {
    return 255;
  }

  uint8_t counts[4] = {0, 0, 0, 0};
  for (uint8_t i = 0; i < HISTORY_SIZE; i++) {
    const uint8_t value = sampleHistory[i];
    if (value <= 3) {
      counts[value]++;
    }
  }

  uint8_t winner = 0;
  uint8_t winnerCount = 0;

  for (uint8_t button = 0; button <= 3; button++) {
    if (counts[button] > winnerCount) {
      winner = button;
      winnerCount = counts[button];
    }
  }

  return winnerCount >= REQUIRED_STABLE_COUNT ? winner : 255;
}

void notifyButtonEvent(uint8_t buttonId, uint8_t eventType) {
  if (!buttonCharacteristic || !deviceConnected || buttonId == 0) {
    return;
  }

  uint8_t payload[2] = {buttonId, eventType};
  buttonCharacteristic->setValue(payload, sizeof(payload));
  buttonCharacteristic->notify();

#if DEBUG_SERIAL
  Serial.printf("Notify -> button %u %s\n", buttonId, eventType == EVENT_DOWN ? "DOWN" : "UP");
#endif
}

void handleStableStateChange(uint8_t nextStableButton) {
  if (nextStableButton == stableButton) {
    return;
  }

  const uint8_t previousButton = stableButton;
  stableButton = nextStableButton;

  if (previousButton > 0 && previousButton != stableButton) {
    notifyButtonEvent(previousButton, EVENT_UP);
  }

  if (stableButton > 0 && stableButton != previousButton) {
    notifyButtonEvent(stableButton, EVENT_DOWN);
  }
}

void setupBle() {
  NimBLEDevice::init(DEVICE_NAME);

  NimBLEServer *server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService *service = server->createService(SERVICE_UUID);
  buttonCharacteristic = service->createCharacteristic(CHAR_UUID, NIMBLE_PROPERTY::NOTIFY);
  buttonCharacteristic->createDescriptor("2902", NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE);

  service->start();

  NimBLEAdvertising *advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->start();

#if DEBUG_SERIAL
  Serial.println("BLE advertising started");
#endif
}

void setupAdc() {
  analogReadResolution(12);
  analogSetPinAttenuation(ADC_PIN, ADC_11db);
  pinMode(ADC_PIN, INPUT);
}

void setup() {
#if DEBUG_SERIAL
  Serial.begin(115200);
  delay(100);
  Serial.println("Wheelchair Macro Pad firmware starting...");
#endif

  setupAdc();
  setupBle();
}

void loop() {
  const uint32_t now = millis();

  if (now - lastSampleTime < SAMPLE_INTERVAL_MS) {
    return;
  }

  lastSampleTime = now;

  const float measuredVoltage = readVoltage();
  const uint8_t candidate = detectButtonByVoltage(measuredVoltage);

  addHistorySample(candidate);

  const uint8_t stableCandidate = getStableCandidate();
  if (stableCandidate != 255) {
    handleStableStateChange(stableCandidate);
  }

#if DEBUG_SERIAL
  if (now - lastDebugPrint >= 200) {
    lastDebugPrint = now;
    Serial.printf("ADC=%u V=%.3f candidate=%u stable=%u\n", lastRaw, lastVoltage, lastCandidate, stableButton);
  }
#endif
}
