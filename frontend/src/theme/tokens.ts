// Theme tokens issus du design Banani "Aicity V1" (style.css).

export const colors = {
  background: '#FFFDF8',
  foreground: '#082B38',
  border: '#D6E4E8',
  input: '#EDF5F7',
  primary: '#082B38',
  primaryForeground: '#FFFDF8',
  secondary: '#42A8B7',
  secondaryForeground: '#082B38',
  muted: '#EDF5F7',
  mutedForeground: '#4A7A8A',
  accent: '#42A8B7',
  accentForeground: '#082B38',
  night: '#082B38',
  nightForeground: '#FFFDF8',
  cream: '#FFFDF8',
  teal: '#42A8B7',
  tealLight: '#D0EEF2',
  card: '#FFFDF8',
  cardDark: '#0D3C4F',
  destructive: '#E05C5C',
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  default: 8,
} as const;

// En React Native chaque graisse est une famille distincte, chargée dans App.tsx.
export const fonts = {
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
  headings: 'SpaceGrotesk_400Regular',
  headingsBold: 'SpaceGrotesk_700Bold',
} as const;

// Tailles de texte "borne" (plus grandes que le mobile standard).
export const textSize = {
  xs: 14,
  sm: 16,
  base: 20,
  lg: 24,
  xl: 30,
  '2xl': 38,
  '3xl': 52,
  '4xl': 70,
} as const;
