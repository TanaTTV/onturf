export type UserRole =
  | "artist"
  | "producer"
  | "engineer"
  | "videographer"
  | "designer"
  | "venue_promoter"
  | "fan";

export type ShowStatus = "pending" | "approved" | "rejected";

export type ProfileLinks = {
  instagram?: string;
  spotify?: string;
  soundcloud?: string;
  youtube?: string;
  website?: string;
  twitch?: string;
};

export type LinkPageItem = {
  label: string;
  url: string;
};

/** How the avatar is used as the page backdrop. "off" = use the solid bg color. */
export type AvatarBg = "off" | "blur" | "pixelate";

/** Config for the /l/<username> Linktree-style page (stored as the link_page jsonb). */
export type LinkPageConfig = {
  enabled: boolean;
  bg_color: string; // palette key, see LINK_PAGE_COLORS
  avatar_bg: AvatarBg;
  effect: string; // overlay effect key, see LINK_PAGE_EFFECTS
  links: LinkPageItem[];
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  city: string;
  roles: UserRole[];
  genres: string[];
  open_to_work: boolean;
  links: ProfileLinks;
  link_page: LinkPageConfig | Record<string, never>;
  is_admin: boolean;
  founding_member: boolean;
  created_at: string;
  updated_at: string;
};

export type Venue = {
  id: string;
  name: string;
  city: string;
  address: string | null;
  all_ages: boolean;
  created_at: string;
};

export type Show = {
  id: string;
  title: string;
  flyer_url: string | null;
  venue_id: string | null;
  venue_name_freetext: string | null;
  city: string;
  starts_at: string;
  price_text: string | null;
  all_ages: boolean;
  genres: string[];
  ticket_url: string | null;
  description: string | null;
  submitted_by: string | null;
  status: ShowStatus;
  created_at: string;
};

export type ShowWithVenue = Show & {
  venues: Pick<Venue, "name" | "address" | "all_ages"> | null;
};

export type LineupEntry = {
  show_id: string;
  profile_id: string;
  billing_order: number;
  profiles?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url" | "roles">;
};

export type Credit = {
  id: string;
  owner_id: string;
  credited_id: string;
  role_label: string;
  work_title: string;
  work_url: string | null;
  confirmed: boolean;
  created_at: string;
};

export type ProfileEmbed = {
  id: string;
  profile_id: string;
  embed_url: string;
  sort_order: number;
};

export type InviteCode = {
  code: string;
  label: string | null;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
};

export type Feedback = {
  id: string;
  user_id: string | null;
  message: string;
  path: string | null;
  created_at: string;
  author?: Pick<Profile, "username" | "display_name"> | null;
};
