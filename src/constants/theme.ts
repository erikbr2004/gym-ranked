import type { RankName } from './rankingConfig';

export const colors = {
  background: '#0A0E13',
  surface: '#141A22',
  surfaceAlt: '#1B232E',
  surfacePressed: '#222C39',
  border: '#27313F',
  primary: '#B8F53D',
  primaryPressed: '#9ED62C',
  onPrimary: '#0A0E13',
  text: '#F2F5F8',
  textMuted: '#93A0B2',
  textSubtle: '#627083',
  success: '#3DDC84',
  warning: '#FFB020',
  danger: '#FF5A5F',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export const rankColors: Record<RankName, string> = {
  Iniciante: '#8A94A6',
  Bronze: '#CD8A4E',
  Prata: '#C3CBD6',
  Ouro: '#F2C14E',
  Platina: '#4FD1C5',
  Diamante: '#6FA8FF',
  Mestre: '#B57BFF',
  Elite: '#FF4D6D',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 40,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export const sizes = {
  /** Área mínima de toque recomendada pelas diretrizes de acessibilidade. */
  touchTarget: 44,
  iconSm: 16,
  iconMd: 20,
  iconLg: 28,
  avatarSm: 48,
  avatarLg: 96,
} as const;

/** Adiciona transparência a uma cor hexadecimal `#RRGGBB`. */
export function withAlpha(hexColor: string, alpha: number): string {
  const alphaHex = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hexColor}${alphaHex}`;
}
