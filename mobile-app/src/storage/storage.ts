import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MacroMap, MedicalInfo } from "../types";
import { createDefaultMacroMap } from "../actions/macroActions";

const MACROS_KEY = "@wheelchair_macro_map";
const HIGH_CONTRAST_KEY = "@wheelchair_high_contrast";
const MEDICAL_KEY = "@wheelchair_medical_info";

export const defaultMedicalInfo: MedicalInfo = {
  fullName: "",
  allergies: "",
  conditions: "",
  medications: "",
  notes: ""
};

export interface StoredSettings {
  macros: MacroMap;
  highContrast: boolean;
  medicalInfo: MedicalInfo;
}

export const loadStoredSettings = async (): Promise<StoredSettings> => {
  const [macroRaw, contrastRaw, medicalRaw] = await Promise.all([
    AsyncStorage.getItem(MACROS_KEY),
    AsyncStorage.getItem(HIGH_CONTRAST_KEY),
    AsyncStorage.getItem(MEDICAL_KEY)
  ]);

  let macros: MacroMap = createDefaultMacroMap();
  let medicalInfo: MedicalInfo = defaultMedicalInfo;

  if (macroRaw) {
    try {
      macros = JSON.parse(macroRaw) as MacroMap;
    } catch {
      macros = createDefaultMacroMap();
    }
  }

  if (medicalRaw) {
    try {
      medicalInfo = JSON.parse(medicalRaw) as MedicalInfo;
    } catch {
      medicalInfo = defaultMedicalInfo;
    }
  }

  return {
    macros,
    highContrast: contrastRaw === "true",
    medicalInfo
  };
};

export const saveMacros = async (macros: MacroMap) => {
  await AsyncStorage.setItem(MACROS_KEY, JSON.stringify(macros));
};

export const saveHighContrast = async (enabled: boolean) => {
  await AsyncStorage.setItem(HIGH_CONTRAST_KEY, enabled ? "true" : "false");
};

export const saveMedicalInfo = async (medicalInfo: MedicalInfo) => {
  await AsyncStorage.setItem(MEDICAL_KEY, JSON.stringify(medicalInfo));
};
