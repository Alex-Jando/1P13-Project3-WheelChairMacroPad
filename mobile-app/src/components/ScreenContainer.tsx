import { MotiView } from "moti";
import { type ReactNode } from "react";
import { ScrollView, StyleSheet, ViewStyle } from "react-native";

interface ScreenContainerProps {
  children: ReactNode;
  contentStyle?: ViewStyle;
}

export const ScreenContainer = ({ children, contentStyle }: ScreenContainerProps) => {
  return (
    <MotiView
      animate={{ opacity: 1, translateY: 0 }}
      from={{ opacity: 0, translateY: 10 }}
      style={styles.flex}
      transition={{ duration: 240, type: "timing" }}
    >
      <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  content: {
    gap: 14,
    paddingBottom: 18
  }
});
