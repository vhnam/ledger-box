import { ListIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';

import { Button } from '@vhnam/ui/components/button';

const LINKS = [
  { href: '#situation', label: 'The situation' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#design-decisions', label: 'Design decisions' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="border-border text-foreground flex h-11 w-11 items-center justify-center rounded-md border"
      >
        {open ? <XIcon size={20} /> : <ListIcon size={20} />}
      </button>

      {open ? (
        <nav className="bg-background border-border absolute inset-x-0 top-16 z-20 border-b px-6 py-4 shadow-lg">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Button
                  variant="link"
                  nativeButton={false}
                  className="h-auto justify-start px-2 py-3 text-base"
                  render={<a href={link.href} onClick={() => setOpen(false)} />}
                >
                  {link.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
