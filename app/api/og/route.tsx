// GET /api/og — the shareable card image (1200×630) for a Green Room moment.
//
// This is the viral artifact: when someone posts a /s?... link to Twitter or
// r/Screenwriting, this renders the card — a character's line, who said it, and
// "THE GREEN ROOM · BY ARQO". Stateless: everything comes from the query string
// (n=name, r=role, q=quote, i=initial), so no DB and no storage.

import { ImageResponse } from "next/og";

export const runtime = "edge";

const VOID = "#0a0d07";
const STAGE = "#0e1711";
const CREAM = "#f3eee3";
const SPRING = "#a5e857";
const SPRINGPALE = "#c8ee9a";
const CANOPY = "#3f7a1c";
const FOG = "#b9c4ba";

function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = clamp(searchParams.get("n") || "A character", 40);
  const role = clamp(searchParams.get("r") || "", 60);
  const quote = clamp(searchParams.get("q") || "They only know what the page knows.", 200);
  const initial = (searchParams.get("i") || name.charAt(0) || "•").charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          backgroundColor: VOID,
          backgroundImage: `radial-gradient(900px 500px at 78% 12%, rgba(63,122,28,0.30), transparent 70%)`,
          padding: "62px 66px",
          color: CREAM,
          fontFamily: "sans-serif",
        }}
      >
        {/* top: wordmark + bulb dot */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: SPRING }} />
          <div style={{ display: "flex", fontSize: "22px", fontWeight: 800, letterSpacing: "0.04em", color: CREAM }}>
            THE GREEN ROOM
          </div>
        </div>

        {/* middle: quote + monogram */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "48px", marginTop: "26px" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                fontSize: quote.length > 120 ? "46px" : "58px",
                lineHeight: 1.28,
                fontWeight: 600,
                color: CREAM,
              }}
            >
              “{quote}”
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "30px" }}>
              <div style={{ width: "34px", height: "2px", backgroundColor: SPRING }} />
              <div style={{ display: "flex", fontSize: "26px", fontWeight: 700, color: SPRINGPALE }}>
                {name}
              </div>
              {role ? (
                <div style={{ display: "flex", fontSize: "20px", color: FOG }}>· {role}</div>
              ) : null}
            </div>
          </div>

          {/* monogram */}
          <div
            style={{
              display: "flex",
              width: "230px",
              height: "230px",
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              backgroundColor: CANOPY,
              border: `2px solid rgba(165,232,87,0.35)`,
            }}
          >
            <div style={{ display: "flex", fontSize: "120px", fontWeight: 800, color: CREAM }}>{initial}</div>
          </div>
        </div>

        {/* bottom: the hook */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(243,238,227,0.14)",
            paddingTop: "22px",
          }}
        >
          <div style={{ display: "flex", fontSize: "21px", color: FOG }}>
            Talk to the characters in your script.
          </div>
          <div style={{ display: "flex", fontSize: "20px", fontWeight: 700, color: SPRING }}>
            The Green Room
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
