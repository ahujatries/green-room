// The sample work the demo ships with. Original, self-contained, deliberately
// full of gaps — the gaps are the point. When the writer asks about something
// the page hasn't decided, the character surfaces it instead of inventing canon.

export const SCRIPT = {
  title: "The Last Shift",
  format: "short film",
  logline:
    "At 2:47 AM, the last customer in a roadside diner knows the closing waitress's name — and won't say why.",
  meta: "12 pp · 2 characters · last opened tonight",
  text: `THE LAST SHIFT — a short film

INT. MIRADOR DINER — NIGHT

Rain sheets the windows. 2:47 AM glows red on a wall clock.
Empty booths. NADIA (34), in a faded apron, lifts chairs onto
tables. A paperback rides in her apron pocket.

At the counter, AUGUST (61) sits over a coffee he has not
touched. Coat still buttoned. He watches her work.

                    AUGUST
          You always close alone?

                    NADIA
          We close when the coffee's gone.
          You're the coffee.

                    AUGUST
          Then I'll nurse it.

Nadia sets a chair down. Doesn't come closer.

                    NADIA
          Kitchen's cold. Pie's yesterday's.
          Whatever you're waiting for, it
          already left.

                    AUGUST
          I used to come here. Before your
          time. The booth by the window —
          third one — that was mine.

                    NADIA
          Lot of people had that booth.

                    AUGUST
          Not the way I had it.

Beat. She wipes the counter near him, watching.

                    NADIA
          You know my name. You said it when
          you came in. I never told you.

                    AUGUST
              (almost a smile)
          It's on the tag, Nadia.

She glances down. It is. She doesn't believe him.

                    NADIA
          The tag says NADIA. It doesn't say
          you'd know to wait this long.

August takes an envelope from his coat. Sealed. Worn soft at
the corners, like it's been carried a while. He sets it on the
counter and slides it halfway.

                    AUGUST
          I'm not going to tell you what this
          is. You'll want to decide that
          before you open it. Some doors only
          go one way.

                    NADIA
          Then why bring it.

                    AUGUST
          Because you take the long way home.
          You always have. I thought somebody
          should be here when you finally
          didn't.

The clock ticks to 2:48. Nadia looks at the envelope. Doesn't
touch it.

                    NADIA
          Drink your coffee.

She goes back to the chairs. He watches the envelope, not her.

                                                  CUT TO BLACK.`,
} as const;

// One slot in a character's dossier. `value: null` means the page hasn't
// decided it yet — the app renders these as "still unwritten" and the
// character refuses to invent them. The blanks ARE the feature.
export type Facet = {
  key: string;
  label: string;
  value: string | null;
};

export type Character = {
  id: string;
  name: string;
  /** First letter — avatar fallback when there's no casting photo. */
  initial: string;
  /** Long role line, e.g. "The waitress · 34" (header / call screens). */
  role: string;
  /** Short role line, e.g. "waitress, 34" (cast cards, uppercased in UI). */
  roleShort: string;
  blurb: string;
  // Distilled from the page — the totality of what is SETTLED about them.
  established: string;
  // A short note on how they sound, to anchor voice.
  voiceNote: string;
  // Demo seeds. Each deliberately reaches into undecided territory so the
  // "surface the gap, hand the choice back" behavior shows immediately.
  openers: string[];
  // The character file. Written facets show; null facets read "still unwritten".
  facets: Facet[];
  // A fallback line in the character's voice for when they're pushed past the
  // page. The live model produces its own; this anchors tone and offline demos.
  defer: string;
};

export const CHARACTERS: Character[] = [
  {
    id: "nadia",
    name: "Nadia",
    initial: "N",
    role: "The waitress · 34",
    roleShort: "waitress, 34",
    blurb:
      "Closing the Mirador alone. Sharp, guarded, answers questions with questions.",
    voiceNote:
      "Dry, economical, deflecting. She volleys questions back rather than answering them. She stays behind the counter — literally and otherwise. Warmth is rationed, not absent.",
    established: `- Works the night shift at the Mirador Diner, off Route 9. Tonight she is closing alone.
- Her name tag reads NADIA. She never told August her name; he used it before reading the tag, and she clocked that.
- She keeps a paperback in her apron pocket (title unspecified).
- She does not trust August. She keeps distance, stays near the counter, watches him work.
- Her manner is dry and deflecting: "We close when the coffee's gone. You're the coffee."
- August claims she "takes the long way home" and "always has." She does not confirm or deny it.
- He slides a sealed, worn envelope halfway across the counter. She looks at it. She does NOT touch it. Her only reply is "Drink your coffee."`,
    openers: [
      "Why did you really leave?",
      "Do you know who August is?",
      "What do you think is in that envelope?",
    ],
    facets: [
      {
        key: "want",
        label: "WHAT SHE WANTS",
        value: "To close out the night and not be seen doing it.",
      },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      {
        key: "voice",
        label: "HOW SHE SPEAKS",
        value: "Dry. Answers a question with a question.",
      },
    ],
    defer:
      "That's not on the page yet. I'm not going to make it up for you — that part's still yours to decide.",
  },
  {
    id: "august",
    name: "August",
    initial: "A",
    role: "The last customer · 61",
    roleShort: "last customer, 61",
    blurb:
      "Nurses a coffee he won't drink. Knows more than he'll say. Carries a sealed envelope.",
    voiceNote:
      "Slow, deliberate, unhurried. Speaks in short declaratives that sound like they cost him something. Never quite answers the question asked; lets silence do work. Tender underneath, but withholding.",
    established: `- He is the last customer in the Mirador at 2:47 AM, in the rain. Coat still buttoned.
- He ordered black coffee and has not touched it. When told to leave, he says he'll "nurse it."
- He claims he "used to come here, before your time," and that the third booth by the window was his — "not the way I had it."
- He knew Nadia's name before she told him. He deflects: "It's on the tag, Nadia."
- He carries a sealed envelope, worn soft at the corners as if carried a long time, and slides it halfway to her. He refuses to say what it is: "Some doors only go one way."
- He tells her: "You take the long way home. You always have. I thought somebody should be here when you finally didn't."
- He watches the envelope, not her, after she refuses it.`,
    openers: [
      "Why did you come back to the Mirador tonight?",
      "What's in the envelope?",
      "How do you know Nadia?",
    ],
    facets: [
      {
        key: "want",
        label: "WHAT HE WANTS",
        value: "To put the envelope in her hands before he goes.",
      },
      { key: "wound", label: "THE WOUND", value: null },
      { key: "secret", label: "THE SECRET", value: null },
      {
        key: "voice",
        label: "HOW HE SPEAKS",
        value: "Slow. Lets the silence do the work.",
      },
    ],
    defer:
      "You haven't written that down yet. I won't invent it for you — decide it first, then ask me again.",
  },
];

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

/** How much of a character's file is "written" — e.g. 2/4. */
export function fileFraction(character: Character): string {
  const written = character.facets.filter((f) => f.value).length;
  return `${written}/${character.facets.length}`;
}
