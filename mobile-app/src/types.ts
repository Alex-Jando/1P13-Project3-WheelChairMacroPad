export type ButtonId = 1 | 2 | 3;

export type MacroActionType =
  | "EMERGENCY_CALL"
  | "CALL_CAREGIVER"
  | "SEND_SOS_SMS"
  | "LOUD_ALARM"
  | "SHARE_LOCATION"
  | "OPEN_MEDICAL_INFO"
  | "NONE";

export type ButtonEventType = "DOWN" | "UP";

export interface ButtonEvent {
  buttonId: ButtonId;
  eventType: ButtonEventType;
  timestamp: number;
}

export interface MacroActionConfig {
  type: MacroActionType;
  label: string;
  icon: string;
  phoneNumber?: string;
  smsNumber?: string;
  smsMessage?: string;
}

export type MacroMap = Record<ButtonId, MacroActionConfig>;

export interface MedicalInfo {
  fullName: string;
  allergies: string;
  conditions: string;
  medications: string;
  notes: string;
}
