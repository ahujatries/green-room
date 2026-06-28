// /s — the public landing page for a shared Green Room moment.
//
// This is where a posted link lands. It renders the card (the character's line)
// + a primary CTA that pulls the viewer INTO Green Room to try it themselves —
// which then hits the Arqo funnel. The OG image (for the unfurl on Twitter /
// Reddit / iMessage) is the dynamic /api/og card. Stateless: everything is in
// the query string, so no DB.

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

type SP = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}
function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

function read(sp: SP) {
  const name = clamp(one(sp.n) || "A character", 40);
  const role = clamp(one(sp.r), 60);
  const quote = clamp(one(sp.q) || "They only know what the page knows.", 200);
  const initial = (one(sp.i) || name.charAt(0) || "•").charAt(0).toUpperCase();
  const ref = one(sp.ref);
  const refOk = /^[A-Za-z0-9_-]{6,32}$/.test(ref) ? ref : "";
  return { name, role, quote, initial, ref: refOk };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SP>;
}): Promise<Metadata> {
  const { name, role, quote, initial } = read(await searchParams);
  // Build the OG image as an ABSOLUTE url on the host actually serving this
  // page, so unfurls work on the vercel.app URL now and greenroom.tryarqo.com
  // once the domain is live — independent of metadataBase.
  const h = await headers();
  const host = h.get("host") ?? "greenroom.tryarqo.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const og = `${proto}://${host}/api/og?n=${encodeURIComponent(name)}&r=${encodeURIComponent(
    role,
  )}&q=${encodeURIComponent(quote)}&i=${encodeURIComponent(initial)}`;
  const title = `${name} — The Green Room by Arqo`;
  const description = `“${clamp(quote, 140)}” — Talk to the characters in your script. By Arqo.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { name, role, quote, initial, ref } = read(await searchParams);
  const enterHref = ref ? `/?ref=${ref}` : "/";

  return (
    <main className="min-h-dvh w-full bg-void">
      <div className="shell-bg grain relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-hidden font-sans text-bonelit sm:my-4 sm:min-h-[860px] sm:rounded-[28px] sm:border sm:border-bonelit/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/arqo-spiral.svg"
          alt=""
          className="pointer-events-none absolute -bottom-[90px] -right-[70px] z-0 w-[380px] opacity-[0.045]"
        />

        <div className="relative z-10 flex flex-1 flex-col">
          {/* bulb strip */}
          <div className="flex h-[14px] flex-none items-center justify-between border-b border-black/40 bg-[rgba(6,13,8,0.5)] px-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="bulb" />
            ))}
          </div>

          {/* header */}
          <header className="flex flex-none items-center gap-[9px] border-b border-bonelit/10 px-[18px] pb-[11px] pt-[13px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/arqo-spiral.svg" alt="Arqo" className="h-[22px] w-[22px] flex-none" />
            <span className="font-sans text-[18px] font-black tracking-tight text-bonelit">
              the green room
            </span>
            <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-springpale">
              by Arqo
            </span>
          </header>

          {/* the moment */}
          <div className="flex flex-1 flex-col px-[22px] pb-9 pt-[30px]">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-springpale">
              From the page
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-[64px] w-[64px] flex-none items-center justify-center rounded-full bg-canopy font-script text-[30px] font-bold text-[#f3eee3]">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-script text-[22px] font-bold leading-none text-bonelit">
                  {name}
                </div>
                {role ? (
                  <div className="mt-1.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.13em] text-springpale">
                    {role}
                  </div>
                ) : null}
              </div>
            </div>

            <blockquote className="mt-6 border-l-2 border-spring/50 pl-4 font-script text-[20px] leading-[1.5] text-bonelit">
              &ldquo;{quote}&rdquo;
            </blockquote>

            <div className="mt-auto pt-9">
              <p className="text-[14px] leading-[1.6] text-fog">
                This is The Green Room — paste any script and talk to its
                characters. They only know what the page knows.
              </p>
              <Link
                href={enterHref}
                className="mt-4 flex items-center justify-center rounded-xl bg-spring px-4 py-[14px] font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-void transition-opacity hover:opacity-90"
              >
                Talk to your own characters →
              </Link>
              <a
                href="https://www.tryarqo.com/waitlist"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 block text-center text-[11.5px] leading-[1.6] text-mist2"
              >
                A taste of <span className="font-semibold text-fog">Arqo</span> —
                the studio that remembers your work.{" "}
                <span className="font-semibold text-springpale">Join the waitlist →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
