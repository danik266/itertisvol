/** Своя цветовая тема у каждого раздела, чтобы сайт не выглядел одинаковым. */
export interface Accent {
  /** Градиент шапки раздела. */
  hero: string;
  /** Заливка активного фильтра и кнопок. */
  solid: string;
  soft: string;
  text: string;
  ring: string;
  /** Точное значение для инлайновых стилей (чипы, полосы). */
  hex: string;
}

export const ACCENTS = {
  teal: {
    hero: 'from-[#0f5f63] via-[#137b80] to-[#1aa1a7]',
    solid: 'bg-teal-600 hover:bg-teal-700',
    soft: 'bg-teal-50 text-teal-700',
    text: 'text-teal-600',
    ring: 'focus:border-teal-400',
    hex: '#0d7f75',
  },
  violet: {
    hero: 'from-[#3b1f6b] via-[#5b2fa3] to-[#7c4dd6]',
    solid: 'bg-violet-600 hover:bg-violet-700',
    soft: 'bg-violet-50 text-violet-700',
    text: 'text-violet-600',
    ring: 'focus:border-violet-400',
    hex: '#7c3aed',
  },
  amber: {
    hero: 'from-[#7c3d09] via-[#c2620f] to-[#f0891f]',
    solid: 'bg-amber-600 hover:bg-amber-700',
    soft: 'bg-amber-50 text-amber-700',
    text: 'text-amber-600',
    ring: 'focus:border-amber-400',
    hex: '#d97706',
  },
  rose: {
    hero: 'from-[#6d1030] via-[#a81845] to-[#e0345f]',
    solid: 'bg-rose-600 hover:bg-rose-700',
    soft: 'bg-rose-50 text-rose-700',
    text: 'text-rose-600',
    ring: 'focus:border-rose-400',
    hex: '#e11d48',
  },
} satisfies Record<string, Accent>;

export type AccentName = keyof typeof ACCENTS;
