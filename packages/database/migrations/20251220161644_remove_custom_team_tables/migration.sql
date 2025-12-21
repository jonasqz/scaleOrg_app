-- Drop team tables (now using Clerk Organizations)
DROP TABLE IF EXISTS "team_invitations";
DROP TABLE IF EXISTS "team_members";

-- Drop enums
DROP TYPE IF EXISTS "InvitationStatus";
DROP TYPE IF EXISTS "TeamRole";
