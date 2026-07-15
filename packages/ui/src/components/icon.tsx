import * as PhosphorIcons from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { type ComponentProps } from 'react';

import { cn } from '../lib/utils';

type IconName = {
  [K in keyof typeof PhosphorIcons]: (typeof PhosphorIcons)[K] extends PhosphorIcon
    ? K extends `${string}Icon`
      ? K
      : never
    : never;
}[keyof typeof PhosphorIcons];

type IconBaseProps = Omit<ComponentProps<PhosphorIcon>, 'ref'>;

type IconProps =
  | (IconBaseProps & { name: IconName; icon?: never })
  | (IconBaseProps & { icon: PhosphorIcon; name?: never });

function Icon({ name, icon, className, ...props }: IconProps) {
  const IconPrimitive = icon ?? PhosphorIcons[name];

  return <IconPrimitive data-slot="icon" className={cn('size-4', className)} {...props} />;
}

export { Icon };
export type { IconName, PhosphorIcon };
