import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  ACTION_OPTIONS,
  createMacroForType,
  type ActionOption
} from "../actions/macroActions";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAppTheme } from "../theme/ThemeContext";
import type { ButtonId, MacroActionConfig, MacroMap } from "../types";

interface MacroConfigScreenProps {
  macros: MacroMap;
  onChangeMacro: (buttonId: ButtonId, next: MacroActionConfig) => void;
}

const ActionChip = ({
  option,
  selected,
  onPress
}: {
  option: ActionOption;
  selected: boolean;
  onPress: () => void;
}) => {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? `${theme.colors.primary}22` : "transparent"
        }
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? theme.colors.primary : theme.colors.text }]}>
        {option.label}
      </Text>
    </Pressable>
  );
};

export const MacroConfigScreen = ({ macros, onChangeMacro }: MacroConfigScreenProps) => {
  const theme = useAppTheme();
  const buttonIds: ButtonId[] = [1, 2, 3];

  const updateMacro = (buttonId: ButtonId, patch: Partial<MacroActionConfig>) => {
    onChangeMacro(buttonId, {
      ...macros[buttonId],
      ...patch
    });
  };

  const renderInputs = (buttonId: ButtonId, macro: MacroActionConfig) => {
    if (macro.type === "CALL_CAREGIVER" || macro.type === "EMERGENCY_CALL") {
      return (
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(text) => updateMacro(buttonId, { phoneNumber: text })}
          placeholder={macro.type === "EMERGENCY_CALL" ? "911" : "Phone Number"}
          placeholderTextColor={theme.colors.secondaryText}
          style={[
            styles.input,
            { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }
          ]}
          value={macro.phoneNumber ?? ""}
        />
      );
    }

    if (macro.type === "SEND_SOS_SMS") {
      return (
        <View style={styles.inputStack}>
          <TextInput
            keyboardType="phone-pad"
            onChangeText={(text) => updateMacro(buttonId, { smsNumber: text })}
            placeholder="SMS Number"
            placeholderTextColor={theme.colors.secondaryText}
            style={[
              styles.input,
              { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }
            ]}
            value={macro.smsNumber ?? ""}
          />
          <TextInput
            multiline
            onChangeText={(text) => updateMacro(buttonId, { smsMessage: text })}
            placeholder="SOS message"
            placeholderTextColor={theme.colors.secondaryText}
            style={[
              styles.input,
              styles.textArea,
              { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }
            ]}
            value={macro.smsMessage ?? ""}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <ScreenContainer>
      <Text style={[styles.helperText, { color: theme.colors.secondaryText }]}>Choose an action for each physical button and set any required phone/SMS fields.</Text>

      {buttonIds.map((buttonId) => {
        const macro = macros[buttonId];

        return (
          <View
            key={buttonId}
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>Button {buttonId}</Text>

            <TextInput
              onChangeText={(text) => updateMacro(buttonId, { label: text })}
              placeholder="Tile label"
              placeholderTextColor={theme.colors.secondaryText}
              style={[
                styles.input,
                { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }
              ]}
              value={macro.label}
            />

            <View style={styles.chipWrap}>
              {ACTION_OPTIONS.map((option) => (
                <ActionChip
                  key={`${buttonId}-${option.type}`}
                  onPress={() => onChangeMacro(buttonId, createMacroForType(option.type, macro))}
                  option={option}
                  selected={macro.type === option.type}
                />
              ))}
            </View>

            {renderInputs(buttonId, macro)}
          </View>
        );
      })}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  helperText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "800"
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  chipText: {
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 17,
    fontWeight: "600",
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inputStack: {
    gap: 8
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top"
  }
});
