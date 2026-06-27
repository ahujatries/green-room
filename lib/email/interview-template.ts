import type { InterviewTurn } from "@/lib/green-room/sessions";

// Brand palette (Arqo canon): Ink / Paper / Bone / Spring / Canopy.
const INK = "#0f140d";
const PAPER = "#151c12";
const BONE = "#f3eee3";
const FOG = "#c9cdbf";
const SPRING = "#a5e857";
const LINE = "rgba(243,238,227,0.12)";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A transcript turn as an email-safe table row. User lines are quiet; the
// character's lines carry the page weight (Courier-ish serif feel via Georgia,
// since custom fonts don't load in mail clients).
function turnRow(turn: InterviewTurn, characterName: string): string {
  const isUser = turn.role === "user";
  const who = isUser ? "You" : characterName;
  const whoColor = isUser ? FOG : SPRING;
  const body = esc(turn.text).replace(/\n/g, "<br/>");
  const bodyStyle = isUser
    ? `color:${BONE};font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;`
    : `color:${BONE};font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.62;`;
  return `
    <tr>
      <td style="padding:0 0 18px 0;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.13em;text-transform:uppercase;color:${whoColor};padding-bottom:5px;">${esc(
          who,
        )}</div>
        <div style="${bodyStyle}">${body}</div>
      </td>
    </tr>`;
}

export function renderInterviewEmail(input: {
  characterName: string;
  scriptTitle: string;
  turns: InterviewTurn[];
  appUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Your Green Room interview with ${input.characterName}`;

  const rows = input.turns.map((t) => turnRow(t, input.characterName)).join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${PAPER};border:1px solid ${LINE};border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:26px 28px 18px 28px;border-bottom:1px solid ${LINE};">
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:0.18em;text-transform:uppercase;color:${SPRING};">The Green Room · an Arqo experiment</div>
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:23px;font-weight:bold;color:${BONE};padding-top:10px;">A conversation with ${esc(
                  input.characterName,
                )}</div>
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${FOG};padding-top:8px;">${esc(
                  input.scriptTitle,
                )}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 28px 26px 28px;border-top:1px solid ${LINE};">
                <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${FOG};">They only know what the page knows. Where you pushed past it, the gap is yours to write.</div>
                <a href="${esc(
                  input.appUrl,
                )}" style="display:inline-block;margin-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;color:${INK};background:${SPRING};text-decoration:none;padding:9px 16px;border-radius:9px;">Back to the Green Room →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `The Green Room — a conversation with ${input.characterName}`,
    input.scriptTitle,
    "",
    ...input.turns.map(
      (t) => `${t.role === "user" ? "You" : input.characterName}: ${t.text}`,
    ),
    "",
    `Back to the Green Room: ${input.appUrl}`,
  ].join("\n");

  return { subject, html, text };
}
