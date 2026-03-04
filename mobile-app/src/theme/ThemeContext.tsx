import { createContext, useContext } from "react";

import { getTheme } from "./theme";

interface ThemeContextValue {
  highContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  highContrast: false,
  toggleHighContrast: () => undefined,
  setHighContrast: () => undefined
});

export const ThemeProvider = ThemeContext.Provider;

export const useThemeSettings = () => useContext(ThemeContext);

export const useAppTheme = () => {
  const { highContrast } = useThemeSettings();
  return getTheme(highContrast);
};
