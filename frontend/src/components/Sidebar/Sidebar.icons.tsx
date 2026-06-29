import { SvgIcon as Icon, type IconProps } from "../Icon/SvgIcon";

export function HomeIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h14V10" />
    </Icon>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M21.8 10A10 10 0 1 1 17 3.3" />
      <path d="m9 11 3 3L22 4" />
    </Icon>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </Icon>
  );
}

export function LogoIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3.5 9a9 9 0 1 1 0 6" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4l3 2" />
    </Icon>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2c1 3-1 5-2 6-1 1-2 3-2 5a6 6 0 0 0 12 0c0-3-2-5-3-7-1.5 1-2 2-2 2 0-2 0-4-3-6Z" />
    </Icon>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  );
}
