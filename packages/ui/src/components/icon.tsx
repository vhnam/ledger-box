import * as PhosphorIcons from '@phosphor-icons/react';
import type { IconWeight } from '@phosphor-icons/react';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';

import { cn } from '#/lib/utils';

type IconBaseProps = ComponentPropsWithoutRef<'svg'> & {
  alt?: string;
  color?: string;
  size?: string | number;
  weight?: IconWeight;
  mirrored?: boolean;
};

type PhosphorIcon = ComponentType<IconBaseProps>;

type IconName = Extract<keyof typeof PhosphorIcons, `${string}Icon`>;

type IconProps =
  | (IconBaseProps & { name: IconName; icon?: never })
  | (IconBaseProps & { icon: PhosphorIcon; name?: never });

function Icon({ name, icon, className, ...props }: IconProps) {
  const IconPrimitive = (icon ?? (name && PhosphorIcons[name])) as PhosphorIcon | undefined;

  if (!IconPrimitive) {
    return null;
  }

  return <IconPrimitive data-slot="icon" className={cn('size-4', className)} {...props} />;
}

export { Icon };
export type { IconName, PhosphorIcon };
