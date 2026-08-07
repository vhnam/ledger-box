import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Spinner } from '@vhnam/ui/components/spinner';
import { cn } from '@vhnam/ui/lib/utils';

import {
  FADE_IN_MS,
  FADE_OUT_MS,
  getFadeOutMs,
  prefersReducedMotion,
  useLocaleTransition,
} from '#/lib/locale-transition';

/**
 * Opaque full-viewport veil for intentional locale changes.
 * z-[200] sits above dialogs (z-50) and below toasts (~z-1000) so error toasts stay visible.
 * Centered spinner signals loading so the cover does not feel like a freeze.
 */
function LocaleChangeOverlay() {
  const { phase, beginReveal, completeTransition } = useLocaleTransition();
  const [opaque, setOpaque] = useState(false);
  const reduced = prefersReducedMotion();
  const visible = phase === 'covering' || phase === 'ready' || phase === 'revealing';

  useEffect(() => {
    if (phase === 'covering') {
      if (reduced) {
        setOpaque(true);
        return;
      }

      setOpaque(false);
      const frame = requestAnimationFrame(() => {
        setOpaque(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    if (phase === 'ready') {
      setOpaque(true);
      // Keep the veil opaque for one paint so the new catalog is committed underneath.
      const frame = requestAnimationFrame(() => {
        beginReveal();
      });
      return () => cancelAnimationFrame(frame);
    }

    if (phase === 'revealing') {
      const fadeOutMs = getFadeOutMs(reduced);

      if (fadeOutMs === 0) {
        setOpaque(false);
        completeTransition();
        return;
      }

      setOpaque(false);
      const timer = setTimeout(() => {
        completeTransition();
      }, fadeOutMs);
      return () => clearTimeout(timer);
    }

    setOpaque(false);
  }, [phase, beginReveal, completeTransition, reduced]);

  if (!visible) {
    return null;
  }

  const fadingOut = phase === 'revealing' && !reduced;

  return (
    <div
      aria-hidden="true"
      data-slot="locale-change-overlay"
      className={cn(
        'pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-background',
        !reduced && 'transition-opacity',
        opaque ? 'opacity-100' : 'opacity-0',
      )}
      style={
        reduced
          ? undefined
          : {
              transitionDuration: fadingOut ? `${FADE_OUT_MS}ms` : `${FADE_IN_MS}ms`,
            }
      }
    >
      <Spinner className="size-8 text-muted-foreground motion-reduce:animate-none" />
    </div>
  );
}

function LocaleChangeAnnouncer() {
  const intl = useIntl();
  const { phase } = useLocaleTransition();
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (phase === 'revealing') {
      setMessage(
        intl.formatMessage({
          id: 'settings.locale.changed',
          defaultMessage: 'Language updated',
        }),
      );
    }
  }, [phase, intl]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}

export { LocaleChangeAnnouncer, LocaleChangeOverlay };
