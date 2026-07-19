/**
 * Hex equivalents of the design tokens in app/globals.css, computed with the
 * OKLCh -> sRGB conversion (CSS Color 4 formulas). The PWA manifest and the
 * `<meta name="theme-color">` tag need plain color values — oklch() manifest
 * support is inconsistent across installers — so we precompute hex once here
 * instead of duplicating the source-of-truth tokens in multiple formats.
 *
 * --background: oklch(0.966 0.004 250) -> #f2f4f6
 * --primary:    oklch(0.51 0.13 245)   -> #006bab
 */
export const PWA_BACKGROUND_COLOR = "#f2f4f6";
export const PWA_THEME_COLOR = "#006bab";
