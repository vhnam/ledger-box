import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { canUseViewTransition, switchThemeWithTransition } from './theme-transition';

describe('theme-transition', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubMotionPreference(reduced: boolean) {
    const matchMedia = vi.fn().mockReturnValue({
      matches: reduced,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.stubGlobal('matchMedia', matchMedia);
    vi.stubGlobal('window', { matchMedia });
  }

  it('canUseViewTransition is false when reduced motion is preferred', () => {
    stubMotionPreference(true);
    vi.stubGlobal('document', { startViewTransition: vi.fn() });

    expect(canUseViewTransition()).toBe(false);
  });

  it('canUseViewTransition is false when startViewTransition is missing', () => {
    stubMotionPreference(false);
    vi.stubGlobal('document', {});

    expect(canUseViewTransition()).toBe(false);
  });

  it('switchThemeWithTransition uses view transition when available', () => {
    const setTheme = vi.fn();
    const startViewTransition = vi.fn((callback: () => void) => {
      callback();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      };
    });

    stubMotionPreference(false);
    vi.stubGlobal('document', { startViewTransition });

    switchThemeWithTransition(setTheme, 'dark');

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('switchThemeWithTransition falls back when reduced motion is preferred', () => {
    const setTheme = vi.fn();
    const startViewTransition = vi.fn();

    stubMotionPreference(true);
    vi.stubGlobal('document', { startViewTransition });

    switchThemeWithTransition(setTheme, 'light');

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
