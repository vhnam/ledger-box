import type { ComponentProps } from 'react';

import { cn } from '../lib/utils';
import { Icon, type PhosphorIcon } from './icon';

function Spinner({ className, ...props }: Omit<ComponentProps<PhosphorIcon>, 'ref' | 'name'>) {
  return (
    <Icon
      name="CircleNotchIcon"
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
