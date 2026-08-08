import { flushSync } from 'react-dom';

export const THEME_TRANSITION_MS = 350;

export type AppTheme = 'dark' | 'light' | 'system';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canUseViewTransition(): boolean {
  return (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof document.startViewTransition === 'function' &&
    !prefersReducedMotion()
  );
}

/**
 * Apply a theme change with a short crossfade when View Transitions are available.
 * Falls back to an instant switch for reduced motion / unsupported browsers.
 */
function switchThemeWithTransition(setTheme: (theme: AppTheme) => void, theme: AppTheme): void {
  if (!canUseViewTransition()) {
    setTheme(theme);
    return;
  }

  document.startViewTransition(() => {
    flushSync(() => {
      setTheme(theme);
    });
  });
}

export { canUseViewTransition, prefersReducedMotion, switchThemeWithTransition };
