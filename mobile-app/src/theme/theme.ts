export interface AppTheme {
  colors: {
    background: string;
    surface: string;
    primary: string;
    danger: string;
    text: string;
    secondaryText: string;
    border: string;
    success: string;
    warning: string;
    tabInactive: string;
    flash: string;
  };
}

const baseTheme: AppTheme = {
  colors: {
    background: "#0B0F14",
    surface: "#141A22",
    primary: "#2D9CDB",
    danger: "#EF4444",
    text: "#F4F7FB",
    secondaryText: "#B8C0CC",
    border: "#2A3342",
    success: "#22C55E",
    warning: "#F59E0B",
    tabInactive: "#7F8A99",
    flash: "#F43F5E"
  }
};

const highContrastTheme: AppTheme = {
  colors: {
    background: "#000000",
    surface: "#101010",
    primary: "#00E5FF",
    danger: "#FF1F1F",
    text: "#FFFFFF",
    secondaryText: "#F2F200",
    border: "#FFFFFF",
    success: "#00FF66",
    warning: "#FFD400",
    tabInactive: "#B3B3B3",
    flash: "#FF3300"
  }
};

export const getTheme = (highContrast: boolean): AppTheme =>
  highContrast ? highContrastTheme : baseTheme;
