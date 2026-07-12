import { RiLoaderLine } from '@remixicon/react';
import type { ComponentProps } from 'react';

import { cn } from '../lib/utils';

function Spinner({ className, ...props }: ComponentProps<typeof RiLoaderLine>) {
  return (
    <RiLoaderLine
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
