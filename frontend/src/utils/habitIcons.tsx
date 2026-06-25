/* eslint-disable react-refresh/only-export-components */
import type { ComponentType, ReactNode } from "react";

interface IconProps {
  className?: string;
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export interface HabitIconEntry {
  key: string;
  label: string;
  Icon: ComponentType<IconProps>;
}

export const HABIT_ICONS: HabitIconEntry[] = [
  {
    key: "book",
    label: "Ler",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </Svg>
    ),
  },
  {
    key: "book-open",
    label: "Estudar",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </Svg>
    ),
  },
  {
    key: "activity",
    label: "Exercício",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </Svg>
    ),
  },
  {
    key: "droplet",
    label: "Beber água",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </Svg>
    ),
  },
  {
    key: "moon",
    label: "Dormir",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </Svg>
    ),
  },
  {
    key: "sun",
    label: "Acordar cedo",
    Icon: (p) => (
      <Svg {...p}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </Svg>
    ),
  },
  {
    key: "coffee",
    label: "Café",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <path d="M6 1v3M10 1v3M14 1v3" />
      </Svg>
    ),
  },
  {
    key: "music",
    label: "Praticar",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </Svg>
    ),
  },
  {
    key: "heart",
    label: "Saúde",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </Svg>
    ),
  },
  {
    key: "monitor",
    label: "Trabalhar",
    Icon: (p) => (
      <Svg {...p}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <path d="M8 21h8M12 17v4" />
      </Svg>
    ),
  },
  {
    key: "dollar-sign",
    label: "Poupar",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </Svg>
    ),
  },
  {
    key: "edit",
    label: "Escrever",
    Icon: (p) => (
      <Svg {...p}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </Svg>
    ),
  },
  {
    key: "award",
    label: "Meta",
    Icon: (p) => (
      <Svg {...p}>
        <circle cx="12" cy="8" r="7" />
        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
      </Svg>
    ),
  },
  {
    key: "target",
    label: "Foco",
    Icon: (p) => (
      <Svg {...p}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </Svg>
    ),
  },
];

export const DEFAULT_HABIT_ICON_KEY = "target";

const ICON_MAP: Record<string, ComponentType<IconProps>> = Object.fromEntries(
  HABIT_ICONS.map((entry) => [entry.key, entry.Icon])
);

export function getHabitIcon(key: string): ComponentType<IconProps> {
  return ICON_MAP[key] ?? ICON_MAP[DEFAULT_HABIT_ICON_KEY]!;
}
