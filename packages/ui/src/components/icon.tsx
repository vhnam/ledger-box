import { type RemixiconComponentType } from '@remixicon/react';
import { type ComponentProps } from 'react';

import { cn } from '../lib/utils';

function Icon({
  icon: IconPrimitive,
  className,
  ...props
}: ComponentProps<RemixiconComponentType> & { icon: RemixiconComponentType }) {
  return <IconPrimitive data-slot="icon" className={cn('size-4', className)} {...props} />;
}

export { Icon };
