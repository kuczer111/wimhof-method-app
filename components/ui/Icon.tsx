import { type SVGProps } from 'react';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

type IconSize = keyof typeof sizes;

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: IconSize;
}

function makeIcon(
  children: React.ReactNode,
  defaultProps?: Partial<SVGProps<SVGSVGElement>>,
) {
  return function IconComponent({
    size = 'md',
    className = '',
    ...props
  }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...defaultProps}
        {...props}
        className={`${sizes[size]} ${className}`.trim()}
      >
        {children}
      </svg>
    );
  };
}

// --- BottomNav icons ---

export const ClockIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>,
);

export const CalendarIcon = makeIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>,
);

export const SnowflakeIcon = makeIcon(
  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" />,
);

export const ChartIcon = makeIcon(
  <>
    <path d="M3 3v18h18" />
    <path d="m7 16 4-8 4 5 5-9" />
  </>,
);

export const BookIcon = makeIcon(
  <>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>,
);

export const GearIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>,
);

// --- Milestone icons ---

export const LungsIcon = makeIcon(
  <>
    <path d="M6.081 20C2.5 20 2 16.5 2 14c0-3.5 2-6 4-7.5C7.5 5.25 8 4 8 2" />
    <path d="M17.919 20C21.5 20 22 16.5 22 14c0-3.5-2-6-4-7.5C16.5 5.25 16 4 16 2" />
    <path d="M12 2v20" />
    <path d="M8 8c1.5 1 2.5 2.5 4 2.5s2.5-1.5 4-2.5" />
  </>,
);

export const FireIcon = makeIcon(
  <path d="M12 2c.5 3.5-1 6-3 8 2.5 1 4.5 3 4 7-1 3-4 4-6 4s-5-1-5-5c0-3 2-5 4-6-1-2-1.5-4 0-6 .5-1 1.5-2 3-2h.5c.5 0 1.5 0 2.5 0z" />,
  { fill: 'currentColor', stroke: 'none' },
);

export const TrophyIcon = makeIcon(
  <>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </>,
);

export const MedalIcon = makeIcon(
  <>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2" />
    <path d="m13 12 5.88-9.8" />
    <circle cx="12" cy="17" r="5" />
    <path d="M12 18v-2h-.5" />
  </>,
);

export const GraduationIcon = makeIcon(
  <>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
  </>,
);

export const StarIcon = makeIcon(
  <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
);
