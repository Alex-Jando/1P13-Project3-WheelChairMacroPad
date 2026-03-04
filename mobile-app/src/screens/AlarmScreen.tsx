import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../theme/ThemeContext";

const ALARM_AUDIO_URL = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";

interface AlarmScreenProps {
  visible: boolean;
  onStop: () => void;
}

export const AlarmScreen = ({ visible, onStop }: AlarmScreenProps) => {
  const theme = useAppTheme();
  const playerRef = useRef<ReturnType<typeof createAudioPlayer> | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    const startAlarm = async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
          interruptionMode: "duckOthers"
        });

        const player = createAudioPlayer({ uri: ALARM_AUDIO_URL });
        player.loop = true;
        player.volume = 1;
        player.play();

        if (cancelled) {
          player.pause();
          player.remove();
          return;
        }

        playerRef.current = player;
      } catch {
        // Intentionally silent: the visual alarm still provides emergency feedback.
      }
    };

    void startAlarm();

    return () => {
      cancelled = true;
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
      }
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
        <MotiView
          animate={{ opacity: 0.95 }}
          from={{ opacity: 0.35 }}
          style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.flash }]}
          transition={{ duration: 450, loop: true, type: "timing" }}
        />

        <View style={styles.content}>
          <Text style={styles.alertTitle}>ALARM ACTIVE</Text>
          <Text style={styles.alertBody}>Hold attention and use STOP when safe.</Text>

          <Pressable onPress={onStop} style={styles.stopButton}>
            <Text style={styles.stopText}>STOP</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  content: {
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 22
  },
  alertTitle: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 1
  },
  alertBody: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700"
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 3,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 92,
    minWidth: 220
  },
  stopText: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900"
  }
});
