import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-dvh w-full bg-void">
      <div className="shell-bg grain relative mx-auto flex h-dvh w-full max-w-[440px] flex-col overflow-hidden font-sans text-bonelit sm:my-4 sm:h-[860px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:border sm:border-bonelit/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* spiral watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/arqo-spiral.svg"
          alt=""
          className="pointer-events-none absolute -bottom-[90px] -right-[70px] z-0 w-[380px] opacity-[0.045]"
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-[34px] text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/arqo-spiral.svg"
            alt="Arqo"
            className="mb-7 h-[34px] w-[34px] opacity-90"
          />

          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
            The green room · sign in
          </p>

          <h1 className="mt-3 font-script text-[28px] font-bold leading-[1.1] tracking-tight text-bonelit">
            We couldn&apos;t open the door
          </h1>

          <p className="mt-[13px] max-w-[290px] text-[14.5px] leading-[1.6] text-fog">
            That sign-in link didn&apos;t go through. It may have expired or
            already been used. No harm done — just try again.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-bonelit/10 bg-spring px-7 py-[13px] text-[13px] font-semibold tracking-tight text-void transition-opacity hover:opacity-90"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
