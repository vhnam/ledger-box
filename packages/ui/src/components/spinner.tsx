import type { ComponentProps } from 'react';

import { Icon, type PhosphorIcon } from '#/components/icon';
import { cn } from '#/lib/utils';

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
