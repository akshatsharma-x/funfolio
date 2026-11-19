// The Co-op Lobby's party invite (PART 15): the quest types, the form's validation (zod/mini — small enough to ship
// with the island, so sending never needs a network request) with BYTE's in-character errors, and the mailto: / copy
// builders. Pure and client-safe; the address comes from content.ts through the server-rendered form (R1).

import { z } from "zod/mini";

export const QUEST_TYPES = ["Full-time", "Internship", "Freelance", "Collab", "Just saying hi"] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

export const NAME_MAX = 80;

/** BYTE's line in the invite dialog (game copy). */
export const BYTE_INVITE = "Hey! Want to team up with Akshat? Fill this in — I'll deliver it personally.";

/** The sheet the form folds into and the paper plane it becomes — the same four points, so one morphs into the other. */
export const SHEET = "6,4 30,4 30,20 6,20";
export const PLANE = "2,3 31,12 2,21 10,12";
export const MESSAGE_MAX = 2000;

const InviteSchema = z.object({
  name: z.string().check(z.trim(), z.minLength(1, "Every player needs a name — even “Player 2” works."), z.maxLength(NAME_MAX, `That's a whole saga — keep the name under ${NAME_MAX} characters.`)),
  quest: z.enum(QUEST_TYPES, "Pick a quest type — “Just saying hi” counts too."),
  message: z.string().check(z.trim(), z.minLength(1, "That message looks empty — even BYTE needs words."), z.maxLength(MESSAGE_MAX, `BYTE can only carry ${MESSAGE_MAX.toLocaleString("en")} characters per flight.`)),
});

export type Invite = { name: string; quest: QuestType; message: string };
export type InviteErrors = Partial<Record<keyof Invite, string>>;

/** Validates the raw form values; on failure, one in-character message per field (first problem wins). */
export function checkInvite(raw: { name: unknown; quest: unknown; message: unknown }): { ok: true; invite: Invite } | { ok: false; errors: InviteErrors } {
  const r = z.safeParse(InviteSchema, raw);
  if (r.success) return { ok: true, invite: r.data };
  const errors: InviteErrors = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof Invite | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** "[Funfolio] Internship from Ada" */
export const inviteSubject = (i: Invite): string => `[Funfolio] ${i.quest} from ${i.name}`;

/** The mailto: link — subject and body URL-encoded (spaces as %20, which every mail app reads; "+" would not be). */
export const mailtoHref = (to: string, i: Invite): string =>
  `mailto:${to}?subject=${encodeURIComponent(inviteSubject(i))}&body=${encodeURIComponent(i.message)}`;

/** What [Copy message] puts on the clipboard, for people without a mail app. */
export const inviteText = (to: string, i: Invite): string => `To: ${to}\nSubject: ${inviteSubject(i)}\n\n${i.message}`;
