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
  EnvelopeSimpleIcon,
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
  KeyIcon,
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
  UserCircleIcon,
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
  EnvelopeSimpleIcon,
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
  KeyIcon,
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
  UserCircleIcon,
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

// Google's brand mark is multicolor, unlike the monochrome Phosphor set, so it's a
// standalone SVG rather than an entry in the `icons` registry. Pass it via `<Icon icon={GoogleLogoIcon} />`.
function GoogleLogoIcon({ className, ...props }: IconBaseProps) {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 24 24"
      className={cn('size-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A11.996 11.996 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.28A11.996 11.996 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

export { GoogleLogoIcon, Icon };
export type { IconName, PhosphorIcon };
