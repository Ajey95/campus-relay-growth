import { neon } from '@neondatabase/serverless';
import { createHash, createHmac, randomBytes } from 'node:crypto';

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}
export const id = () => randomBytes(16).toString('hex');
export const token = () => randomBytes(32).toString('base64url');
export const digest = (value:string) => createHash('sha256').update(value).digest('hex');
export function emailDigest(email:string) {
  if (!process.env.EMAIL_HASH_SECRET) throw new Error('EMAIL_HASH_SECRET is not configured');
  return createHmac('sha256',process.env.EMAIL_HASH_SECRET).update(email.trim().toLowerCase()).digest('hex');
}

let initialized: Promise<void> | undefined;
export function ensureSchema() {
  initialized ||= (async()=>{
    const sql=db();
    await sql`CREATE TABLE IF NOT EXISTS demo_workspaces (
      id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
      seed_mode boolean NOT NULL DEFAULT false, target_year integer NOT NULL DEFAULT 2027,
      operator_token_digest text NOT NULL UNIQUE
    )`;
    await sql`CREATE TABLE IF NOT EXISTS campaign_links (
      id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
      source text NOT NULL, medium text NOT NULL, partner_id text NOT NULL DEFAULT '', campus_id text NOT NULL DEFAULT '',
      creative_variant text NOT NULL DEFAULT 'standard', active boolean NOT NULL DEFAULT true,
      synthetic boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_links_workspace ON campaign_links(workspace_id,source)`;
    await sql`CREATE TABLE IF NOT EXISTS visitors (
      id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
      first_link_id text REFERENCES campaign_links(id), last_link_id text REFERENCES campaign_links(id),
      first_source text NOT NULL DEFAULT 'direct_unknown', last_source text NOT NULL DEFAULT 'direct_unknown',
      first_seen_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now(),
      synthetic boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_visitors_workspace ON visitors(workspace_id,first_source)`;
    await sql`CREATE TABLE IF NOT EXISTS exposures (
      visitor_id text NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      experiment_id text NOT NULL, arm text NOT NULL CHECK (arm IN ('A','B')),
      exposed_at timestamptz NOT NULL DEFAULT now(), synthetic boolean NOT NULL DEFAULT false,
      PRIMARY KEY(visitor_id,experiment_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS recommendations (
      id text PRIMARY KEY, visitor_id text NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      template_id text NOT NULL, branch text NOT NULL, level text NOT NULL,
      interests jsonb NOT NULL, outcome text NOT NULL, friend_branch text,
      shown_at timestamptz NOT NULL DEFAULT now(), synthetic boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recs_visitor ON recommendations(visitor_id,shown_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS registrations (
      id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
      workshop_id text NOT NULL DEFAULT 'first-ai-project-60', visitor_id text NOT NULL REFERENCES visitors(id),
      email_digest text NOT NULL, graduation_year integer NOT NULL, branch text NOT NULL, eligible boolean NOT NULL,
      first_link_id text REFERENCES campaign_links(id), last_link_id text REFERENCES campaign_links(id),
      first_source text NOT NULL, last_source text NOT NULL,
      registered_at timestamptz NOT NULL DEFAULT now(), synthetic boolean NOT NULL DEFAULT false,
      UNIQUE(workspace_id,workshop_id,email_digest)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reg_workspace ON registrations(workspace_id,eligible,first_source)`;
    await sql`CREATE TABLE IF NOT EXISTS invites (
      id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
      inviter_registration_id text NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
      token_digest text NOT NULL UNIQUE, issued_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL, synthetic boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invites_workspace ON invites(workspace_id)`;
    await sql`CREATE TABLE IF NOT EXISTS referrals (
      invite_id text NOT NULL REFERENCES invites(id) ON DELETE CASCADE,
      invitee_registration_id text NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
      primary_or_assist text NOT NULL CHECK(primary_or_assist IN ('primary','assist')),
      synthetic boolean NOT NULL DEFAULT false, PRIMARY KEY(invite_id,invitee_registration_id)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS events (
      id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES demo_workspaces(id) ON DELETE CASCADE,
      visitor_id text REFERENCES visitors(id) ON DELETE SET NULL,
      type text NOT NULL, at timestamptz NOT NULL DEFAULT now(),
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb, synthetic boolean NOT NULL DEFAULT false
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_events_workspace ON events(workspace_id,at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS rate_limits (
      scope text NOT NULL, key_digest text NOT NULL, minute_bucket bigint NOT NULL,
      requests integer NOT NULL DEFAULT 1, PRIMARY KEY(scope,key_digest,minute_bucket)
    )`;
    await sql`CREATE TABLE IF NOT EXISTS ai_daily_limits (
      scope text NOT NULL, key_digest text NOT NULL, day_bucket bigint NOT NULL,
      requests integer NOT NULL DEFAULT 1, PRIMARY KEY(scope,key_digest,day_bucket)
    )`;
  })().catch(error=>{initialized=undefined;throw error});
  return initialized;
}

export async function workspace(workspaceId:string) {
  const sql=db();
  const rows=await sql`SELECT * FROM demo_workspaces WHERE id=${workspaceId} AND expires_at>now()`;
  return rows[0] || null;
}
export async function operator(workspaceId:string, supplied:string|null) {
  if (!supplied || supplied.length > 200) return false;
  const w=await workspace(workspaceId);
  return !!w && w.operator_token_digest===digest(supplied);
}
export async function logEvent(workspaceId:string, visitorId:string|null, type:string, metadata:Record<string,unknown>={}) {
  const sql=db();
  await sql`INSERT INTO events(id,workspace_id,visitor_id,type,metadata) VALUES(${id()},${workspaceId},${visitorId},${type},${JSON.stringify(metadata)}::jsonb)`;
}
