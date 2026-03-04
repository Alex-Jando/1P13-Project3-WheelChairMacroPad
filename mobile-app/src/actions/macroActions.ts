import * as Location from "expo-location";
import { Linking, Platform, Share } from "react-native";

import type { MacroActionConfig, MacroActionType, MacroMap } from "../types";

export interface ActionOption {
  type: MacroActionType;
  label: string;
  icon: string;
}

export const ACTION_OPTIONS: ActionOption[] = [
  { type: "EMERGENCY_CALL", label: "Emergency Call (911)", icon: "phone-alert" },
  { type: "CALL_CAREGIVER", label: "Call Caregiver", icon: "phone" },
  { type: "SEND_SOS_SMS", label: "Send SOS SMS", icon: "message-alert" },
  { type: "LOUD_ALARM", label: "Loud Alarm Screen", icon: "alarm-light" },
  { type: "SHARE_LOCATION", label: "Share Location", icon: "map-marker-radius" },
  { type: "OPEN_MEDICAL_INFO", label: "Open Medical Info", icon: "file-document-outline" },
  { type: "NONE", label: "No Action", icon: "close-circle-outline" }
];

const defaultMacroFromType = (type: MacroActionType): MacroActionConfig => {
  switch (type) {
    case "EMERGENCY_CALL":
      return { type, label: "Emergency Call (911)", icon: "phone-alert", phoneNumber: "911" };
    case "CALL_CAREGIVER":
      return { type, label: "Call Caregiver", icon: "phone", phoneNumber: "" };
    case "SEND_SOS_SMS":
      return {
        type,
        label: "Send SOS SMS",
        icon: "message-alert",
        smsNumber: "",
        smsMessage: "I need help. Please call me."
      };
    case "LOUD_ALARM":
      return { type, label: "Loud Alarm Screen", icon: "alarm-light" };
    case "SHARE_LOCATION":
      return { type, label: "Share Location", icon: "map-marker-radius" };
    case "OPEN_MEDICAL_INFO":
      return { type, label: "Open Medical Info", icon: "file-document-outline" };
    default:
      return { type: "NONE", label: "No Action", icon: "close-circle-outline" };
  }
};

export const createMacroForType = (
  type: MacroActionType,
  existing?: MacroActionConfig
): MacroActionConfig => {
  const template = defaultMacroFromType(type);
  return {
    ...template,
    label: existing?.label?.trim().length ? existing.label : template.label,
    phoneNumber: existing?.phoneNumber ?? template.phoneNumber,
    smsNumber: existing?.smsNumber ?? template.smsNumber,
    smsMessage: existing?.smsMessage ?? template.smsMessage
  };
};

export const createDefaultMacroMap = (): MacroMap => ({
  1: createMacroForType("EMERGENCY_CALL"),
  2: createMacroForType("CALL_CAREGIVER"),
  3: createMacroForType("SEND_SOS_SMS")
});

const openDialer = async (number: string) => {
  const trimmed = number.trim();
  if (!trimmed) {
    return false;
  }

  const url = `tel:${trimmed}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    return false;
  }

  await Linking.openURL(url);
  return true;
};

const openSms = async (number: string, message: string) => {
  if (!number.trim()) {
    return false;
  }

  const encodedBody = encodeURIComponent(message);
  const separator = Platform.OS === "ios" ? "&" : "?";
  const smsUrl = `sms:${number}${separator}body=${encodedBody}`;
  const supported = await Linking.canOpenURL(smsUrl);

  if (!supported) {
    return false;
  }

  await Linking.openURL(smsUrl);
  return true;
};

export interface MacroExecutionHelpers {
  requestEmergencyConfirmation: (phoneNumber: string) => void;
  openAlarmScreen: () => void;
  openMedicalInfo: () => void;
  showMessage: (message: string) => void;
}

export const executeMacroAction = async (
  action: MacroActionConfig,
  helpers: MacroExecutionHelpers
) => {
  switch (action.type) {
    case "EMERGENCY_CALL": {
      helpers.requestEmergencyConfirmation(action.phoneNumber || "911");
      break;
    }
    case "CALL_CAREGIVER": {
      const success = await openDialer(action.phoneNumber || "");
      if (!success) {
        helpers.showMessage("Caregiver number is missing or invalid.");
      }
      break;
    }
    case "SEND_SOS_SMS": {
      const success = await openSms(action.smsNumber || "", action.smsMessage || "I need help.");
      if (!success) {
        helpers.showMessage("SMS contact is missing or unsupported on this device.");
      }
      break;
    }
    case "LOUD_ALARM": {
      helpers.openAlarmScreen();
      break;
    }
    case "SHARE_LOCATION": {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        helpers.showMessage("Location permission is required for Share Location.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const lat = position.coords.latitude.toFixed(6);
      const lon = position.coords.longitude.toFixed(6);
      const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;

      await Share.share({
        message: `I need assistance. My location is ${lat}, ${lon}. ${mapsUrl}`
      });
      break;
    }
    case "OPEN_MEDICAL_INFO": {
      helpers.openMedicalInfo();
      break;
    }
    case "NONE":
    default:
      helpers.showMessage("No action configured for this button.");
      break;
  }
};

export const confirmEmergencyCall = async (phoneNumber: string) => {
  const success = await openDialer(phoneNumber || "911");
  return success;
};
