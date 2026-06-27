import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next && next.startsWith("/") ? next : "/");
  }

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

        <div className="relative z-10 flex h-full flex-col">
          {/* bulb strip */}
          <div className="flex h-[14px] flex-none items-center justify-between border-b border-black/40 bg-[rgba(6,13,8,0.5)] px-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {/* header */}
          <header className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 px-[18px] pb-[11px] pt-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/arqo-spiral.svg"
              alt="Arqo"
              className="h-[22px] w-[22px] flex-none"
            />
            <span className="font-sans text-[18px] font-black tracking-tight text-bonelit">
              the green room
            </span>
            <div className="flex-1" />
            <span className="text-right font-mono text-[8px] font-medium uppercase leading-[1.4] tracking-[0.13em] text-mist">
              an arqo
              <br />
              experiment
            </span>
          </header>

          {/* content */}
          <div className="gr-scroll flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-[26px] py-10">
            <div className="mx-auto w-full max-w-[340px]">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
                Sign in
              </p>
              <h1 className="mt-3 font-script text-[30px] font-bold leading-[1.1] tracking-tight text-bonelit">
                Step into the green room.
              </h1>
              <p className="mb-7 mt-[11px] text-[14px] leading-[1.6] text-fog">
                Your scripts, your cast, your call. Sign in and the room knows
                whose work it&rsquo;s holding.
              </p>

              <LoginForm next={next} />

              <p className="mt-7 border-t border-bonelit/15 pt-[14px] text-[11px] leading-[1.6] text-mist2">
                They only know what the page knows. Everything you bring stays
                yours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
