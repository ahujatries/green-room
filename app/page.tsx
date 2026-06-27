// The Green Room home.
//
// No auth, no database: the writer pastes a script, we derive its cast, and the
// whole "room" lives in the browser. This entry just hands off to the client
// root, which decides between the add-script screen and the room itself.

import { GreenRoom } from "@/components/green-room";

export default function Page() {
  return <GreenRoom />;
}
