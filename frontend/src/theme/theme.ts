import { createTheme, type MantineColorsTuple } from '@mantine/core';

/**
 * Palette Catppuccin intégrée dans Mantine v7.
 * Les CSS custom properties (--bg-base, --accent, etc.) restent définies dans
 * variables.css pour la compatibilité avec les composants non-Mantine.
 * Ici on mappe les couleurs Catppuccin comme primaryColor de Mantine.
 */

// Catppuccin Mocha blue (#89b4fa) — 10 shades du plus clair au plus foncé
const ctpBlue: MantineColorsTuple = [
  '#eef3ff', // 0 — très clair
  '#dde8ff',
  '#b3ccff',
  '#89b4fa', // 3 — blue mocha (accent dark)
  '#74c7ec', // 4 — sapphire mocha
  '#6eb1f5',
  '#5096ee',
  '#3979e0',
  '#1e66f5', // 8 — blue latte (accent light)
  '#0a52e0', // 9 — foncé
];

// Statuts
const statusColors = {
  interested: '#9399b2', // overlay1 mocha
  applied: '#89b4fa',   // blue mocha
  interview: '#f9e2af', // yellow mocha
  offer: '#a6e3a1',     // green mocha
  rejected: '#f38ba8',  // red mocha
};

export const theme = createTheme({
  primaryColor: 'ctpBlue',
  colors: {
    ctpBlue,
  },

  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Fira Code, monospace',

  defaultRadius: 'md',

  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },

  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.25rem', lineHeight: '1.1' },
      h2: { fontSize: '1.75rem', lineHeight: '1.15' },
      h3: { fontSize: '1.375rem', lineHeight: '1.2' },
      h4: { fontSize: '1.125rem', lineHeight: '1.25' },
      h5: { fontSize: '1rem', lineHeight: '1.3' },
      h6: { fontSize: '0.875rem', lineHeight: '1.4' },
    },
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
    },
    Drawer: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

export { statusColors };
