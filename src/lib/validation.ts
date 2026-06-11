import { z } from "zod";
import { GENRES, LINK_KEYS } from "./constants";

export const usernameSchema = z
  .string()
  .regex(/^[a-z0-9_.]{3,30}$/, "3–30 chars: lowercase letters, numbers, _ or .");

const optionalUrl = z
  .string()
  .trim()
  .url("must be a valid url (include https://)")
  .or(z.literal(""))
  .optional();

export const linksSchema = z.object(
  Object.fromEntries(LINK_KEYS.map((k) => [k, optionalUrl])) as Record<
    (typeof LINK_KEYS)[number],
    typeof optionalUrl
  >
);

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().trim().min(1, "required").max(80),
  bio: z.string().max(500, "max 500 characters").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "pick at least one role"),
  genres: z.array(z.enum(GENRES)).max(8, "max 8 genres").default([]),
  open_to_work: z.boolean().default(false),
  links: linksSchema.default({}),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const showSchema = z.object({
  title: z.string().trim().min(1, "required").max(120),
  venue_id: z.string().uuid().optional().or(z.literal("")),
  venue_name_freetext: z.string().trim().max(120).optional().or(z.literal("")),
  starts_at: z.string().min(1, "required"), // datetime-local string
  price_text: z.string().trim().max(60).optional().or(z.literal("")),
  all_ages: z.boolean().default(false),
  genres: z.array(z.enum(GENRES)).max(6).default([]),
  ticket_url: optionalUrl,
  description: z.string().max(1000, "max 1000 characters").optional().or(z.literal("")),
});

export type ShowFormValues = z.infer<typeof showSchema>;

export const creditSchema = z.object({
  credited_username: z.string().min(1, "required"),
  role_label: z.string().trim().min(1, "required").max(40),
  work_title: z.string().trim().min(1, "required").max(120),
  work_url: optionalUrl,
});

export type CreditFormValues = z.infer<typeof creditSchema>;

export const embedSchema = z.object({
  embed_url: z
    .string()
    .trim()
    .url("must be a valid url")
    .refine(
      (u) => /(?:spotify\.com|soundcloud\.com|youtube\.com|youtu\.be)/.test(u),
      "must be a spotify, soundcloud, or youtube link"
    ),
});

export type EmbedFormValues = z.infer<typeof embedSchema>;
