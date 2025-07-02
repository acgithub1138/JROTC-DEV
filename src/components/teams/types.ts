export interface Team {
  id: string;
  name: string;
  description: string | null;
  team_lead_id: string | null;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  cadet_id: string;
  role: string | null;
  joined_at: string;
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[];
  member_count: number;
  member_ids?: string[]; // For form handling
  team_lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export interface NewTeam {
  name: string;
  description: string;
  team_lead_id: string;
  member_ids: string[];
}