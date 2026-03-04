import { StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { useAppTheme } from "../theme/ThemeContext";
import type { MedicalInfo } from "../types";

interface MedicalInfoScreenProps {
  medicalInfo: MedicalInfo;
  onChange: (next: MedicalInfo) => void;
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
}

const Field = ({ label, value, onChangeText, multiline = false }: FieldProps) => {
  const theme = useAppTheme();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: theme.colors.secondaryText }]}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.secondaryText}
        style={[
          styles.input,
          multiline && styles.textArea,
          { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }
        ]}
        value={value}
      />
    </View>
  );
};

export const MedicalInfoScreen = ({ medicalInfo, onChange }: MedicalInfoScreenProps) => {
  const theme = useAppTheme();

  const patch = (field: keyof MedicalInfo, value: string) => {
    onChange({
      ...medicalInfo,
      [field]: value
    });
  };

  return (
    <ScreenContainer>
      <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Medical Card</Text>
        <Text style={[styles.helper, { color: theme.colors.secondaryText }]}>Store critical info locally so it can be opened quickly from a macro action.</Text>

        <Field label="Full Name" onChangeText={(text) => patch("fullName", text)} value={medicalInfo.fullName} />
        <Field label="Allergies" onChangeText={(text) => patch("allergies", text)} value={medicalInfo.allergies} multiline />
        <Field
          label="Conditions"
          onChangeText={(text) => patch("conditions", text)}
          value={medicalInfo.conditions}
          multiline
        />
        <Field
          label="Medications"
          onChangeText={(text) => patch("medications", text)}
          value={medicalInfo.medications}
          multiline
        />
        <Field label="Notes" onChangeText={(text) => patch("notes", text)} value={medicalInfo.notes} multiline />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  heading: {
    fontSize: 25,
    fontWeight: "800"
  },
  helper: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23
  },
  fieldWrap: {
    gap: 6
  },
  label: {
    fontSize: 15,
    fontWeight: "700"
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 17,
    fontWeight: "600",
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top"
  }
});
