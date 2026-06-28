"use client";

// CONSENT — Arqo ID connect. Pixel-faithful port of PROTOTYPE.html's
// CONSENT section (call-sheet brutalist). The brand header + spiral lockup
// are rendered by the shell (green-room.tsx); this component is the scroll body.

export function ConsentView({
  onCreateFree,
  onAuthorize,
  onBack,
}: {
  onCreateFree: () => void;
  onAuthorize: () => void;
  onBack: () => void;
}) {
  return (
    <div className="gr-scroll rise flex h-full flex-col overflow-hidden px-5 py-6">
      {/* eyebrow */}
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Connect · Arqo ID
      </div>

      {/* lockup row — Arqo spiral chip · stitch dots · spiral well */}
      <div className="mt-[18px] flex items-center justify-center gap-[14px]">
        <span className="flex h-[54px] w-[54px] items-center justify-center border-2 border-brink bg-bonepaper hard-sm">
          {/* Green Room mark — three clipped facets */}
          <span className="relative block h-[30px] w-[30px]">
            <span
              className="absolute inset-0 bg-springpale"
              style={{ clipPath: "polygon(50% 2%,98% 26%,50% 50%,2% 26%)" }}
            />
            <span
              className="absolute inset-0 bg-header"
              style={{ clipPath: "polygon(2% 26%,50% 50%,50% 98%,2% 74%)" }}
            />
            <span
              className="absolute inset-0"
              style={{
                clipPath: "polygon(50% 50%,98% 26%,98% 74%,50% 98%)",
                background: "#79B330",
              }}
            />
          </span>
        </span>
        <span className="flex gap-[5px]">
          <span className="h-[6px] w-[6px] border border-brink bg-spring" />
          <span className="h-[6px] w-[6px] border border-brink bg-spring" />
          <span className="h-[6px] w-[6px] border border-brink bg-spring" />
        </span>
        <span className="flex h-[54px] w-[54px] items-center justify-center border-2 border-brink bg-[#1E3A12] hard-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arqo-spiral.svg" alt="Arqo" className="h-[27px] w-[27px]" />
        </span>
      </div>

      {/* headline */}
      <h1 className="mt-5 text-center font-sans text-[24px] font-black uppercase leading-[1.08] tracking-[-0.02em] text-brink">
        Green Room wants to connect to your Arqo&nbsp;ID
      </h1>

      {/* identity chip */}
      <div className="mt-[18px] flex items-center gap-[11px] border-2 border-brink bg-bonepaper px-[13px] py-[11px]">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-header font-script text-[18px] font-bold text-callbone">
          I
        </span>
        <span className="min-w-0">
          <span className="block font-sans text-[14px] font-bold text-brink">
            Isabella Vizetta
          </span>
          <span className="block font-mono text-[9.5px] text-quill">
            isabella@tryarqo.com
          </span>
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-canopytext"
        >
          Switch
        </button>
      </div>

      {/* permissions list */}
      <div className="mt-4 font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-quill">
        Green Room will be able to
      </div>
      <div className="mt-[11px] flex flex-col gap-[11px]">
        <div className="flex items-start gap-[11px]">
          <span className="flex h-5 w-5 flex-none items-center justify-center border-2 border-brink bg-spring">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A2418"
              strokeWidth="3.2"
              strokeLinecap="square"
            >
              <path d="M5 12l4 5 10-11" />
            </svg>
          </span>
          <span className="font-sans text-[13px] leading-[1.4] text-brink">
            Read your scripts, characters, and pages
          </span>
        </div>
        <div className="flex items-start gap-[11px]">
          <span className="flex h-5 w-5 flex-none items-center justify-center border-2 border-brink bg-spring">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A2418"
              strokeWidth="3.2"
              strokeLinecap="square"
            >
              <path d="M5 12l4 5 10-11" />
            </svg>
          </span>
          <span className="font-sans text-[13px] leading-[1.4] text-brink">
            See your name and profile photo
          </span>
        </div>
        <div className="flex items-start gap-[11px]">
          <span className="flex h-5 w-5 flex-none items-center justify-center border-2 border-brink bg-bonepaper">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B95236"
              strokeWidth="3"
              strokeLinecap="square"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
          <span className="font-sans text-[13px] leading-[1.4] text-quill">
            Never writes to your account · never trains on your work
          </span>
        </div>
      </div>

      <span className="flex-1" />

      {/* primary — authorize */}
      <button
        type="button"
        onClick={onAuthorize}
        className="lift mt-[18px] flex w-full items-center justify-center gap-[9px] border-2 border-brink bg-spring px-4 py-[15px] font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brink hard"
      >
        Authorize Green Room
      </button>

      {/* create free account */}
      <button
        type="button"
        onClick={onCreateFree}
        className="mt-[10px] w-full border-2 border-brink bg-transparent px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink"
      >
        Create a free account
      </button>

      {/* quiet back */}
      <button
        type="button"
        onClick={onBack}
        className="mt-[10px] w-full bg-transparent py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-quill"
      >
        Not now
      </button>

      <p className="mt-[14px] text-center font-mono text-[8.5px] leading-[1.5] tracking-[0.04em] text-quill/80">
        Revoke anytime in Arqo → Settings → Connected apps
      </p>
    </div>
  );
}
