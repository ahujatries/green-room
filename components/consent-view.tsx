"use client";

// CONSENT — Arqo ID connect. SPINE STUB: functional + on-brand; Wave B (B2)
// replaces the body with the pixel-faithful prototype port (CONSENT section).

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
    <div className="gr-scroll pop flex h-full flex-col overflow-y-auto px-5 py-6">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-canopytext">
        Connect · Arqo ID
      </div>

      <div className="mt-[18px] border-2 border-brink bg-bonepaper p-4">
        <div className="font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-quill">
          Green Room will be able to
        </div>
        <ul className="mt-3 flex flex-col gap-2 text-[13px] leading-[1.45] text-brink">
          <li>· Read the scripts you choose to open here</li>
          <li>· Derive a cast you can talk to</li>
          <li>· Never write back to your Arqo workspace</li>
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <button
          onClick={onAuthorize}
          className="border-2 border-brink bg-spring px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink hard"
        >
          Authorize with Arqo ID
        </button>
        <button
          onClick={onCreateFree}
          className="border-2 border-brink bg-bonepaper px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brink"
        >
          Create a free account
        </button>
        <button
          onClick={onBack}
          className="py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-quill"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
