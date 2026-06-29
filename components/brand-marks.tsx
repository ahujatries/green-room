// Shared brand marks for the Sign-in-with-Arqo flow.
//
// The de-branded preview stripped /public/arqo-spiral.svg, and the auth screens
// are the one place the room re-introduces the Arqo lockup ("Sign in with Arqo").
// So we render the marks inline — fully self-contained, no asset dependency.
//
//   • SpiralMark — the little concentric "arqo" glyph used in the BY-arqo lockup
//   • RoomCube   — the isometric Green Room cube with a lit door; green-lit on the
//                  happy path, red-lit on the auth-error screen
//   • AuthHeader — the green call-sheet header every auth takeover screen shares

type MarkProps = { className?: string };

/** Concentric "arqo" spiral glyph. Strokes inherit `currentColor`. */
export function SpiralMark({ className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.1" />
      <path d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8" />
      <path d="M12 3a9 9 0 0 1 9 9" />
      <path d="M12 18.1A6.1 6.1 0 0 1 5.9 12" />
      <path d="M12 21a9 9 0 0 1-9-9" />
    </svg>
  );
}

/**
 * Isometric Green Room cube with a lit doorway.
 * `tone="green"` for the live/welcome path, `tone="red"` for auth errors.
 */
export function RoomCube({
  tone = "green",
  className,
}: MarkProps & { tone?: "green" | "red" }) {
  const door = tone === "red" ? "#ef5535" : "#a5e857";
  const doorGlow = tone === "red" ? "#7a1f12" : "#3f7a1c";
  const box = tone === "red" ? "#2a0f0a" : "#16280f";
  const boxLight = tone === "red" ? "#46160e" : "#234414";
  const boxTop = tone === "red" ? "#5e1d12" : "#2f5a1a";
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* top face */}
      <path d="M40 8 70 24 40 40 10 24Z" fill={boxTop} stroke="#1a2418" strokeWidth="2" strokeLinejoin="round" />
      {/* left face */}
      <path d="M10 24 40 40 40 72 10 56Z" fill={box} stroke="#1a2418" strokeWidth="2" strokeLinejoin="round" />
      {/* right face */}
      <path d="M70 24 40 40 40 72 70 56Z" fill={boxLight} stroke="#1a2418" strokeWidth="2" strokeLinejoin="round" />
      {/* lit door on the right face */}
      <path d="M52 35 62 40.5 62 56 52 61Z" fill={doorGlow} />
      <path d="M55 37.5 60 40.2 60 53.5 55 56.4Z" fill={door} />
    </svg>
  );
}

/** The shared green call-sheet header for the auth takeover screens. */
export function AuthHeader() {
  return (
    <header className="flex flex-none items-center gap-[9px] border-b-2 border-brink bg-headerdeep px-4 py-[13px]">
      <span className="font-sans text-[15px] font-black uppercase leading-none tracking-[-0.01em] text-callbone">
        The <span className="text-spring">Green</span> Room
      </span>
      <span className="flex-1" />
      <span className="flex items-center gap-[5px] font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-springpale">
        by
        <SpiralMark className="h-[15px] w-[15px] text-spring" />
        <span className="font-sans text-[12px] font-black tracking-[-0.01em] text-callbone">
          arqo
        </span>
      </span>
    </header>
  );
}
