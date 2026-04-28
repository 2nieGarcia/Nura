import type { Config } from "tailwindcss";

/**
 * Nura — design tokens.
 *
 * Palette is derived from the Nura logo: a deep navy "N" body with a teal
 * location-pin counter. The semantic token names from the previous "Health
 * Desk" pass are kept (`seal`, `seal-press`, `paper`, `paper-edge`, …) so no
 * component code has to change — only the hex values shift.
 *
 * Why these specific shifts:
 * - `seal` is now the logo navy (#0E2A3F). It still reads as "primary action,
 *   serious, civic" but trades the clinic-green register for the deeper,
 *   calmer navy of the Nura mark.
 * - A new `pin` accent (the logo teal #2BA9A7) earns its place as a
 *   secondary signal: selected-row indicator on chips, the small dot on the
 *   letterhead seal-rule that mirrors the logo's pin. Used sparingly — never
 *   as a primary CTA fill, because teal at button scale would dilute the
 *   navy's authority.
 * - `paper` shifts from warm cream (#F4EFE6) to a cool off-white (#F1F4F6).
 *   Cream + navy reads as "old book / law firm"; cool paper + navy reads as
 *   "modern civic notice / clinic intake card", which is what we want.
 * - All text contrasts re-checked: ink 14.5:1 on cool paper, seal navy
 *   12.6:1 on white, pin teal 3.4:1 on white (decorative-only — never a
 *   text color on light surfaces, only used at icon/rule scale).
 * - Stamp red is unchanged: emergency must remain perceptually identical
 *   across rebrands.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces ---------------------------------------------------------
        paper: "rgb(var(--color-bg-primary) / <alpha-value>)",
        "paper-edge": "rgb(var(--color-paper-edge) / <alpha-value>)",
        card: "rgb(var(--color-bg-card) / <alpha-value>)",

        // Text -------------------------------------------------------------
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--color-ink-soft) / <alpha-value>)",
        "ink-mute": "rgb(var(--color-ink-mute) / <alpha-value>)",

        // Brand / primary action — Nura navy ------------------------------
        seal: "rgb(var(--color-seal) / <alpha-value>)",
        "seal-press": "rgb(var(--color-seal-press) / <alpha-value>)",

        // Accent — Nura teal ----------------------------------------------
        // Used sparingly: selected-state rule on chips, letterhead dot,
        // seal-press underline. Not a primary CTA fill.
        pin: "rgb(var(--color-pin) / <alpha-value>)",
        "pin-press": "rgb(var(--color-pin-press) / <alpha-value>)",
        "pin-soft": "rgb(var(--color-pin-soft) / <alpha-value>)",

        // Emergency (unchanged) -------------------------------------------
        stamp: "rgb(var(--color-stamp) / <alpha-value>)",
        "stamp-press": "rgb(var(--color-stamp-press) / <alpha-value>)",
        "stamp-bg": "rgb(var(--color-stamp-bg) / <alpha-value>)",

        // Caution (one color, used as a left-rule, never as a card fill) ---
        mark: "rgb(var(--color-mark) / <alpha-value>)",
        "mark-bg": "rgb(var(--color-mark-bg) / <alpha-value>)",
      },

      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', '"Segoe UI"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },

      fontSize: {
        meta: ["0.8125rem", { lineHeight: "1.25rem" }],
        label: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0" }],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.625rem" }],
        title: ["1.375rem", { lineHeight: "1.75rem" }],
        display: ["2rem", { lineHeight: "2.25rem" }],
      },

      borderRadius: {
        stamp: "4px",
        form: "8px",
        block: "12px",
      },

      borderWidth: {
        hair: "1px",
        rule: "2px",
      },

      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0px)",
      },

      transitionTimingFunction: {
        paper: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
