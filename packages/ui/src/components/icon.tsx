import {
  ArrowClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  ArrowsLeftRightIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockCounterClockwiseIcon,
  CopyIcon,
  DesktopIcon,
  DotsThreeIcon,
  DotsThreeVerticalIcon,
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FilePdfIcon,
  FunnelIcon,
  GearIcon,
  GearSixIcon,
  GlobeIcon,
  HeartIcon,
  HouseIcon,
  InfoIcon,
  ListBulletsIcon,
  MoonIcon,
  PaletteIcon,
  PaperclipIcon,
  PencilLineIcon,
  PlusIcon,
  ProhibitIcon,
  ReceiptIcon,
  ScalesIcon,
  ShareIcon,
  SidebarIcon,
  SignOutIcon,
  SpinnerIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UploadSimpleIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
  type IconWeight,
} from '@phosphor-icons/react';
import type { ComponentPropsWithoutRef, ComponentType } from 'react';

import { cn } from '#/lib/utils';

/**
 * Curated registry — do not `import *` from `@phosphor-icons/react`.
 * Add an icon here when a call site needs a new `name`.
 */
const icons = {
  ArrowClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  ArrowsLeftRightIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockCounterClockwiseIcon,
  CopyIcon,
  DesktopIcon,
  DotsThreeIcon,
  DotsThreeVerticalIcon,
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FilePdfIcon,
  FunnelIcon,
  GearIcon,
  GearSixIcon,
  GlobeIcon,
  HeartIcon,
  HouseIcon,
  InfoIcon,
  ListBulletsIcon,
  MoonIcon,
  PaletteIcon,
  PaperclipIcon,
  PencilLineIcon,
  PlusIcon,
  ProhibitIcon,
  ReceiptIcon,
  ScalesIcon,
  ShareIcon,
  SidebarIcon,
  SignOutIcon,
  SpinnerIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UploadSimpleIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  WarningCircleIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} as const;

type IconBaseProps = ComponentPropsWithoutRef<'svg'> & {
  alt?: string;
  color?: string;
  size?: string | number;
  weight?: IconWeight;
  mirrored?: boolean;
};

type PhosphorIcon = ComponentType<IconBaseProps>;

type IconName = keyof typeof icons;

type IconProps =
  | (IconBaseProps & { name: IconName; icon?: never })
  | (IconBaseProps & { icon: PhosphorIcon; name?: never });

function Icon({ name, icon, className, ...props }: IconProps) {
  const IconPrimitive = (icon ?? (name && icons[name])) as PhosphorIcon | undefined;

  if (!IconPrimitive) {
    return null;
  }

  return <IconPrimitive data-slot="icon" className={cn('size-4', className)} {...props} />;
}

export { Icon };
export type { IconName, PhosphorIcon };
