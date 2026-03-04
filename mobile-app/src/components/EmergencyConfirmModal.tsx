import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";

interface EmergencyConfirmModalProps {
  visible: boolean;
  phoneNumber: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const EmergencyConfirmModal = ({
  visible,
  phoneNumber,
  onCancel,
  onConfirm
}: EmergencyConfirmModalProps) => {
  const theme = useAppTheme();

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Emergency Call</Text>
          <Text style={[styles.body, { color: theme.colors.secondaryText }]}>Tap again to confirm opening the dialer for {phoneNumber}.</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { borderColor: theme.colors.border, backgroundColor: "transparent" }]}
            >
              <Text style={[styles.buttonLabel, { color: theme.colors.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.button, { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger }]}
            >
              <Text style={[styles.buttonLabel, { color: "#FFFFFF" }]}>Tap Again to Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 20,
    width: "100%"
  },
  title: {
    fontSize: 28,
    fontWeight: "800"
  },
  body: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
    marginTop: 12
  },
  actions: {
    gap: 10,
    marginTop: 18
  },
  button: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: 10
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: "800"
  }
});
