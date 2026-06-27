// Small stroked icon set, matching the 24-grid line icons in the design.
type P = { className?: string; size?: number; stroke?: number };

function svg(
  path: React.ReactNode,
  { className, size = 20, stroke = 1.75 }: P,
) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {path}
    </svg>
  );
}

export const Back = (p: P) => svg(<path d="M15 5l-7 7 7 7" />, p);
export const ArrowRight = (p: P) => svg(<path d="M5 12h14M13 6l6 6-6 6" />, p);
export const Chat = (p: P) => svg(<path d="M4 5h16v11H9l-4 4v-4H4z" />, p);
export const Phone = (p: P) =>
  svg(
    <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
    p,
  );
export const Video = (p: P) =>
  svg(
    <>
      <rect x="3" y="6" width="12" height="12" rx="1" />
      <path d="M15 10l6-3v10l-6-3z" />
    </>,
    p,
  );
export const Mic = (p: P) =>
  svg(
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </>,
    p,
  );
export const MicOff = (p: P) =>
  svg(
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M4 3l16 18" />
    </>,
    p,
  );
export const Hang = (p: P) =>
  svg(
    <path d="M3 9c5-4 13-4 18 0l-2.5 3-3.5-1v-2a11 11 0 0 0-6 0v2L5.5 12z" />,
    p,
  );
export const Script = (p: P) => svg(<path d="M4 6h16M4 11h16M4 16h10" />, p);
export const Restart = (p: P) =>
  svg(<path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" />, p);
export const Close = (p: P) => svg(<path d="M6 6l12 12M18 6L6 18" />, p);
export const Stop = (p: P) =>
  svg(<rect x="6" y="6" width="12" height="12" rx="2" />, p);
