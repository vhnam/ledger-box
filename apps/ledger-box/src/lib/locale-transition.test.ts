import { describe, expect, it } from 'vite-plus/test';

import {
  getFadeOutMs,
  getMinCoverMs,
  localeTransitionReducer,
  MIN_COVER_MS,
  MIN_COVER_REDUCED_MS,
  remainingMinCoverMs,
  shouldAdvanceToReady,
} from './locale-transition.tsx';

describe('localeTransitionReducer', () => {
  const idle = {
    phase: 'idle' as const,
    targetLocale: null,
    coverStartedAt: null,
  };

  it('beginTransition → covering; second begin ignored', () => {
    const covering = localeTransitionReducer(idle, {
      type: 'begin',
      locale: 'vi-VN',
      now: 1000,
    });

    expect(covering).toEqual({
      phase: 'covering',
      targetLocale: 'vi-VN',
      coverStartedAt: 1000,
    });

    const ignored = localeTransitionReducer(covering, {
      type: 'begin',
      locale: 'ja-JP',
      now: 1100,
    });

    expect(ignored).toEqual(covering);
  });

  it('ready + reveal + complete → idle', () => {
    const covering = localeTransitionReducer(idle, {
      type: 'begin',
      locale: 'fr-FR',
      now: 0,
    });
    const ready = localeTransitionReducer(covering, { type: 'ready' });
    expect(ready.phase).toBe('ready');

    const revealing = localeTransitionReducer(ready, { type: 'reveal' });
    expect(revealing.phase).toBe('revealing');

    const done = localeTransitionReducer(revealing, { type: 'complete' });
    expect(done).toEqual(idle);
  });

  it('failTransition during covering → idle immediately', () => {
    const covering = localeTransitionReducer(idle, {
      type: 'begin',
      locale: 'zh-CN',
      now: 50,
    });

    expect(localeTransitionReducer(covering, { type: 'fail' })).toEqual(idle);
  });

  it('ready is ignored unless covering; reveal ignored unless ready', () => {
    expect(localeTransitionReducer(idle, { type: 'ready' })).toEqual(idle);
    expect(localeTransitionReducer(idle, { type: 'reveal' })).toEqual(idle);
  });
});

describe('shouldAdvanceToReady', () => {
  it('stays covering when messages are not ready even if locale matches', () => {
    expect(
      shouldAdvanceToReady({
        phase: 'covering',
        targetLocale: 'ja-JP',
        activeLocale: 'ja-JP',
        messagesReady: false,
      }),
    ).toBe(false);
  });

  it('advances only when covering, locale matches target, and messages are ready', () => {
    expect(
      shouldAdvanceToReady({
        phase: 'covering',
        targetLocale: 'ja-JP',
        activeLocale: 'ja-JP',
        messagesReady: true,
      }),
    ).toBe(true);

    expect(
      shouldAdvanceToReady({
        phase: 'covering',
        targetLocale: 'ja-JP',
        activeLocale: 'en-US',
        messagesReady: true,
      }),
    ).toBe(false);

    expect(
      shouldAdvanceToReady({
        phase: 'idle',
        targetLocale: 'ja-JP',
        activeLocale: 'ja-JP',
        messagesReady: true,
      }),
    ).toBe(false);
  });
});

describe('timing helpers', () => {
  it('remainingMinCoverMs respects the minimum hold', () => {
    expect(remainingMinCoverMs(0, 100, 350)).toBe(250);
    expect(remainingMinCoverMs(0, 400, 350)).toBe(0);
  });

  it('getMinCoverMs / getFadeOutMs honor reduced motion', () => {
    expect(getMinCoverMs(false)).toBe(MIN_COVER_MS);
    expect(getMinCoverMs(true)).toBe(MIN_COVER_REDUCED_MS);
    expect(getFadeOutMs(false)).toBe(180);
    expect(getFadeOutMs(true)).toBe(0);
  });
});
