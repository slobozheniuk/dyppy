import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "surface-container-high": "#e8e8ea",
        "surface": "#f9f9fc",
        "inverse-on-surface": "#f0f0f3",
        "background": "#f9f9fc",
        "secondary-container": "#9af3b8",
        "primary-fixed": "#ffdad6",
        "surface-container-low": "#f3f3f6",
        "surface-bright": "#f9f9fc",
        "on-surface": "#1a1c1e",
        "on-tertiary": "#ffffff",
        "surface-container": "#eeeef0",
        "on-secondary-container": "#0f7142",
        "surface-dim": "#dadadc",
        "on-primary-container": "#fff2f0",
        "secondary-fixed": "#9df5bb",
        "surface-tint": "#ba1a20",
        "inverse-surface": "#2f3133",
        "tertiary": "#565858",
        "error": "#ba1a1a",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed": "#00210f",
        "outline-variant": "#e4beba",
        "secondary": "#046d3f",
        "primary-container": "#d32f2f",
        "inverse-primary": "#ffb3ac",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#ffb3ac",
        "on-tertiary-fixed-variant": "#454747",
        "secondary-fixed-dim": "#81d9a0",
        "on-error-container": "#93000a",
        "primary": "#af101a",
        "tertiary-fixed-dim": "#c6c6c7",
        "tertiary-container": "#6e7070",
        "on-primary-fixed-variant": "#930010",
        "on-tertiary-fixed": "#1a1c1c",
        "on-primary": "#ffffff",
        "on-background": "#1a1c1e",
        "on-tertiary-container": "#f4f4f4",
        "on-primary-fixed": "#410003",
        "tertiary-fixed": "#e2e2e2",
        "surface-variant": "#e2e2e5",
        "outline": "#8f6f6c",
        "on-surface-variant": "#5b403d",
        "on-secondary-fixed-variant": "#00522e",
        "surface-container-highest": "#e2e2e5"
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    forms,
    containerQueries
  ],
}
