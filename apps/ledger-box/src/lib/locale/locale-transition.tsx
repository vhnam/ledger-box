import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { loadMessages } from '@vhnam/utils/i18n';
import type { SupportedLocale } from '@vhnam/utils/locale';

/** Minimum opaque cover so warm (cached) locale switches still feel intentional. */
export const MIN_COVER_MS = 350;
/** Shortened minimum cover when the user prefers reduced motion. */
export const MIN_COVER_REDUCED_MS = 100;
export const FADE_IN_MS = 150;
export const FADE_OUT_MS = 180;
/** Force-clear the veil if readiness never arrives (hung PATCH / catalog). */
export const COVER_TIMEOUT_MS = 5000;

export type LocaleTransitionPhase = 'idle' | 'covering' | 'ready' | 'revealing';

type LocaleTransitionState = {
  phase: LocaleTransitionPhase;
  targetLocale: SupportedLocale | null;
  coverStartedAt: number | null;
};

type LocaleTransitionAction =
  | { type: 'begin'; locale: SupportedLocale; now: number }
  | { type: 'fail' }
  | { type: 'ready' }
  | { type: 'reveal' }
  | { type: 'complete' };

const initialState: LocaleTransitionState = {
  phase: 'idle',
  targetLocale: null,
  coverStartedAt: null,
};

/**
 * Pure phase transitions — unit-tested. Timers and catalog preload live in the provider.
 * Single-flight: `begin` is ignored unless idle.
 */
export function localeTransitionReducer(
  state: LocaleTransitionState,
  action: LocaleTransitionAction,
): LocaleTransitionState {
  switch (action.type) {
    case 'begin':
      if (state.phase !== 'idle') {
        return state;
      }

      return {
        phase: 'covering',
        targetLocale: action.locale,
        coverStartedAt: action.now,
      };
    case 'fail':
    case 'complete':
      return initialState;
    case 'ready':
      if (state.phase !== 'covering') {
        return state;
      }

      return { ...state, phase: 'ready' };
    case 'reveal':
      if (state.phase !== 'ready') {
        return state;
      }

      return { ...state, phase: 'revealing' };
    default:
      return state;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getMinCoverMs(reduced = prefersReducedMotion()): number {
  return reduced ? MIN_COVER_REDUCED_MS : MIN_COVER_MS;
}

export function getFadeOutMs(reduced = prefersReducedMotion()): number {
  return reduced ? 0 : FADE_OUT_MS;
}

/** True when covering may advance to ready (locale applied + matching catalog). */
export function shouldAdvanceToReady(input: {
  phase: LocaleTransitionPhase;
  targetLocale: SupportedLocale | null;
  activeLocale: SupportedLocale;
  messagesReady: boolean;
}): boolean {
  return (
    input.phase === 'covering' &&
    input.targetLocale != null &&
    input.activeLocale === input.targetLocale &&
    input.messagesReady
  );
}

export function remainingMinCoverMs(coverStartedAt: number, now: number, minCoverMs: number): number {
  return Math.max(0, minCoverMs - (now - coverStartedAt));
}

type LocaleTransitionContextValue = {
  phase: LocaleTransitionPhase;
  targetLocale: SupportedLocale | null;
  beginTransition: (locale: SupportedLocale) => void;
  failTransition: () => void;
  beginReveal: () => void;
  completeTransition: () => void;
};

const LocaleTransitionContext = createContext<LocaleTransitionContextValue | null>(null);

type LocaleTransitionProviderProps = {
  children: ReactNode;
  activeLocale: SupportedLocale;
  messagesReady: boolean;
};

function LocaleTransitionProvider({ children, activeLocale, messagesReady }: LocaleTransitionProviderProps) {
  const [state, dispatch] = useReducer(localeTransitionReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const minHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMinHoldTimer = useCallback(() => {
    if (minHoldTimerRef.current != null) {
      clearTimeout(minHoldTimerRef.current);
      minHoldTimerRef.current = null;
    }
  }, []);

  const clearSafetyTimer = useCallback(() => {
    if (safetyTimerRef.current != null) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const beginTransition = useCallback(
    (locale: SupportedLocale) => {
      if (stateRef.current.phase !== 'idle') {
        return;
      }

      const now = performance.now();
      dispatch({ type: 'begin', locale, now });
      // Warm the catalog in parallel with the PATCH so cold locales are ready sooner.
      void loadMessages(locale);

      clearSafetyTimer();
      safetyTimerRef.current = setTimeout(() => {
        if (import.meta.env.DEV) {
          console.warn('[locale-transition] cover timed out; clearing overlay');
        }
        dispatch({ type: 'fail' });
        clearMinHoldTimer();
        clearSafetyTimer();
      }, COVER_TIMEOUT_MS);
    },
    [clearMinHoldTimer, clearSafetyTimer],
  );

  const failTransition = useCallback(() => {
    clearMinHoldTimer();
    clearSafetyTimer();
    dispatch({ type: 'fail' });
  }, [clearMinHoldTimer, clearSafetyTimer]);

  const beginReveal = useCallback(() => {
    dispatch({ type: 'reveal' });
  }, []);

  const completeTransition = useCallback(() => {
    clearMinHoldTimer();
    clearSafetyTimer();
    dispatch({ type: 'complete' });
  }, [clearMinHoldTimer, clearSafetyTimer]);

  // Gate ready on applied locale + matching catalog, then honor minimum cover hold.
  useEffect(() => {
    if (
      !shouldAdvanceToReady({
        phase: state.phase,
        targetLocale: state.targetLocale,
        activeLocale,
        messagesReady,
      })
    ) {
      return;
    }

    clearSafetyTimer();

    const coverStartedAt = state.coverStartedAt ?? performance.now();
    const remaining = remainingMinCoverMs(coverStartedAt, performance.now(), getMinCoverMs());

    if (remaining === 0) {
      dispatch({ type: 'ready' });
      return;
    }

    clearMinHoldTimer();
    minHoldTimerRef.current = setTimeout(() => {
      if (stateRef.current.phase === 'covering') {
        dispatch({ type: 'ready' });
      }
    }, remaining);

    return () => {
      clearMinHoldTimer();
    };
  }, [
    state.phase,
    state.targetLocale,
    state.coverStartedAt,
    activeLocale,
    messagesReady,
    clearMinHoldTimer,
    clearSafetyTimer,
  ]);

  useEffect(() => {
    return () => {
      clearMinHoldTimer();
      clearSafetyTimer();
    };
  }, [clearMinHoldTimer, clearSafetyTimer]);

  const value = useMemo<LocaleTransitionContextValue>(
    () => ({
      phase: state.phase,
      targetLocale: state.targetLocale,
      beginTransition,
      failTransition,
      beginReveal,
      completeTransition,
    }),
    [state.phase, state.targetLocale, beginTransition, failTransition, beginReveal, completeTransition],
  );

  return <LocaleTransitionContext.Provider value={value}>{children}</LocaleTransitionContext.Provider>;
}

function useLocaleTransition(): LocaleTransitionContextValue {
  const value = useContext(LocaleTransitionContext);

  if (value == null) {
    throw new Error('useLocaleTransition must be used within LocaleTransitionProvider');
  }

  return value;
}

export { LocaleTransitionProvider, useLocaleTransition };
