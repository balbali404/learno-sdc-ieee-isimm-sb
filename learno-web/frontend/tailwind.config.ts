import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        highlight: 'var(--color-highlight)',
        textMain: 'var(--color-text)',
        textMuted: 'var(--color-text-muted)',
        successTheme: 'var(--color-success)',
        errorTheme: 'var(--color-error)',
        borderTheme: 'var(--color-border)',
      },
      borderRadius: {
        theme: 'var(--border-radius)',
      },
      fontSize: {
        base: 'var(--font-size-base)',
      },
    },
  },
  plugins: [],
};

export default config;
