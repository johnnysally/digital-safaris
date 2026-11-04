export const colors = {
  primary: {
    50:  '#FBF8F3', 100: '#F1E6D3', 200: '#E4CFAC', 300: '#C9AA7D',
    400: '#A98253', 500: '#805B35', 600: '#614328', 700: '#442F1D',
    800: '#2A1C12', 900: '#1B120C',
  },
  secondary: {
    50:  '#FFF8EC', 100: '#F9E8C9', 200: '#F1D39A', 300: '#E8B95F',
    400: '#D99A35', 500: '#BD781F', 600: '#A45F19', 700: '#824715',
    800: '#653613', 900: '#48260F',
  },
  background: '#F7F3EA',
  surface:    '#FFFCF6',
  surfaceAlt: '#F6EDDD',
  border:     '#E4D7C2',
  text: {
    primary:   '#34291D',
    secondary: '#5B4935',
    muted:     '#776855',
  },
  white:   '#FFFFFF',
  black:   '#000000',
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
  info:    '#3B82F6',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32,
} as const;

export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, pill: 999,
} as const;

export const font = {
  xs: 11, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 28, '4xl': 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  semibold:'600' as const,
  bold:    '700' as const,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  font,
  fontWeight,
  shadows,
} as const;

export default theme;