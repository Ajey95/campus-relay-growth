import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { BRANCHES, PROJECTS, Answers, pairProject, recommend, validAnswers } from '@/lib/catalog';
import { db, digest, emailDigest, ensureSchema, id, logEvent, operator, token, workspace } from '@/lib/db';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
const error=(status:number,code:string,message:string)=>NextResponse.json({error:{code,message}},{status});
const plain=(value:unknown)=>typeof value==='string' && value.length<=120 ? value.trim() : '';
const base=(req:NextRequest)=>new URL(req.url).origin;
const arm=(visitorId:string,experiment:string)=>parseInt(createHash('sha256').update(visitorId+experiment).digest('hex').slice(0,2),16)%2?'B':'A';
const validEmail=(value:unknown)=>typeof value==='string' && /^[a-z0-9._%+-]+@example\.com$/i.test(value.trim()) && value.length<=100;

async function seed(workspaceId:string) {
  const sql=db();
  const sources:[string,string,string][]=[['club','group','gdg-campus'],['academic','email','department'],['creator','social','student-demo'],['direct_unknown','direct','']];
  const linkIds:Record<string,string>={};
  const links=[];
  for(const [source,medium,partner] of sources.slice(0,3)) {
    const linkId=id(); linkIds[source]=linkId;
    links.push({id:linkId,source,medium,partner_id:partner});
  }
  await sql`INSERT INTO campaign_links(id,workspace_id,source,medium,partner_id,synthetic)
    SELECT x.id,${workspaceId},x.source,x.medium,x.partner_id,true
    FROM jsonb_to_recordset(${JSON.stringify(links)}::jsonb) AS x(id text,source text,medium text,partner_id text)`;
  const sample=['club','club','academic','creator','direct_unknown','club','club','club','academic','academic','creator','creator','direct_unknown','direct_unknown','club','academic'];
  const visitors=[];
  const exposures=[];
  const events=[];
  const registrations=[];
  for(let i=0;i<sample.length;i++) {
    const source=sample[i], visitorId=id(), linkId=linkIds[source]||null;
    visitors.push({id:visitorId,link_id:linkId,source});
    for(const experiment of ['preview','takehome']) exposures.push({visitor_id:visitorId,experiment_id:experiment,arm:arm(visitorId,experiment)});
    if(i<8) events.push({id:id(),visitor_id:visitorId});
    if(i<5) {
      const registrationId=id();
      exposures.push({visitor_id:visitorId,experiment_id:'friend',arm:arm(visitorId,'friend')});
      registrations.push({id:registrationId,visitor_id:visitorId,email_digest:emailDigest(`seed${i}@example.com`),branch:BRANCHES[i],link_id:linkId,source});
    }
  }
  await sql`INSERT INTO visitors(id,workspace_id,first_link_id,last_link_id,first_source,last_source,synthetic)
    SELECT x.id,${workspaceId},x.link_id,x.link_id,x.source,x.source,true
    FROM jsonb_to_recordset(${JSON.stringify(visitors)}::jsonb) AS x(id text,link_id text,source text)`;
  await sql`INSERT INTO exposures(visitor_id,experiment_id,arm,synthetic)
    SELECT x.visitor_id,x.experiment_id,x.arm,true
    FROM jsonb_to_recordset(${JSON.stringify(exposures)}::jsonb) AS x(visitor_id text,experiment_id text,arm text)`;
  await sql`INSERT INTO events(id,workspace_id,visitor_id,type,synthetic)
    SELECT x.id,${workspaceId},x.visitor_id,'form_start',true
    FROM jsonb_to_recordset(${JSON.stringify(events)}::jsonb) AS x(id text,visitor_id text)`;
  await sql`INSERT INTO registrations(id,workspace_id,visitor_id,email_digest,graduation_year,branch,eligible,first_link_id,last_link_id,first_source,last_source,synthetic)
    SELECT x.id,${workspaceId},x.visitor_id,x.email_digest,2027,x.branch,true,x.link_id,x.link_id,x.source,x.source,true
    FROM jsonb_to_recordset(${JSON.stringify(registrations)}::jsonb) AS x(id text,visitor_id text,email_digest text,branch text,link_id text,source text)`;
}

async function body(req:NextRequest) {
  try { const data=await req.json(); return data && typeof data==='object' ? data as Record<string,unknown> : {}; }
  catch { return {}; }
}

export async function POST(req:NextRequest,ctx:Context) {
  const path=(await ctx.params).path;
  try {
    await ensureSchema();
    const sql=db();
    const data=await body(req);
    if(path[0]==='demo-workspaces' && path.length===1) {
      const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
      const key=digest(ip), bucket=Math.floor(Date.now()/60000);
      await sql`DELETE FROM rate_limits WHERE minute_bucket<${bucket-60}`;
      await sql`DELETE FROM demo_workspaces WHERE expires_at<now()`;
      const limits=await sql`INSERT INTO rate_limits(scope,key_digest,minute_bucket,requests) VALUES('workspace_create',${key},${bucket},1) ON CONFLICT(scope,key_digest,minute_bucket) DO UPDATE SET requests=rate_limits.requests+1 RETURNING requests`;
      if(Number(limits[0].requests)>8) return error(429,'rate_limit','Please wait a minute before creating another demo workspace.');
      const workspaceId=id(), operatorToken=token(), seeded=data.seedMode===true;
      await sql`INSERT INTO demo_workspaces(id,expires_at,seed_mode,target_year,operator_token_digest) VALUES(${workspaceId},now()+interval '7 days',${seeded},2027,${digest(operatorToken)})`;
      if(seeded) await seed(workspaceId);
      return NextResponse.json({workspaceId,seeded,expiresInDays:7,studentUrl:`${base(req)}/w/${workspaceId}`,operatorUrl:`${base(req)}/desk/${workspaceId}#operator=${operatorToken}`},{status:201});
    }
    if(path[0]==='recommendations' && path.length===1) {
      const workspaceId=plain(data.workspaceId), visitorId=plain(data.visitorId);
      if(!validAnswers(data.answers)) return error(422,'invalid_answers','Choose a supported engineering branch, level and up to two interests.');
      const visitor=await sql`SELECT id FROM visitors WHERE id=${visitorId} AND workspace_id=${workspaceId}`;
      if(!visitor.length) return error(404,'visitor_missing','Start a demo visit before requesting a project.');
      const answers=data.answers as Answers, results=recommend(answers);
      await sql`INSERT INTO recommendations(id,visitor_id,template_id,branch,level,interests,outcome) VALUES(${id()},${visitorId},${results[0].id},${answers.branch},${answers.level},${JSON.stringify(answers.interests)}::jsonb,${answers.outcome})`;
      await logEvent(workspaceId,visitorId,'recommendation',{templateId:results[0].id});
      return NextResponse.json({primary:results[0],alternatives:results.slice(1),reason:`Fits ${answers.branch}, your ${answers.level} level and ${answers.interests.length?answers.interests.join(' + '):'starter'} interest. The first hour has a defined input, output and limitation.`});
    }
    if(path[0]==='events' && path.length===1) {
      const workspaceId=plain(data.workspaceId), visitorId=plain(data.visitorId);
      const visitor=await sql`SELECT id FROM visitors WHERE id=${visitorId} AND workspace_id=${workspaceId}`;
      if(!visitor.length || data.type!=='form_start') return error(422,'invalid_event','Invalid form event.');
      await logEvent(workspaceId,visitorId,'form_start');
      return NextResponse.json({recorded:true});
    }
    if(path[0]==='visits' && path.length===1) {
      const workspaceId=plain(data.workspaceId), existingId=plain(data.visitorId), linkId=plain(data.linkId), inviteToken=plain(data.inviteToken);
      if(!await workspace(workspaceId)) return error(404,'workspace_missing','This demo workspace has expired or does not exist.');
      const count=await sql`SELECT count(*)::int AS n FROM visitors WHERE workspace_id=${workspaceId}`;
      if(Number(count[0].n)>=2000) return error(429,'workspace_full','This demo has reached its visitor limit. Create a fresh workspace.');
      const link=linkId ? (await sql`SELECT id,source FROM campaign_links WHERE id=${linkId} AND workspace_id=${workspaceId} AND active=true`)[0] : null;
      const invite=inviteToken ? (await sql`SELECT id FROM invites WHERE token_digest=${digest(inviteToken)} AND workspace_id=${workspaceId} AND expires_at>now()`)[0] : null;
      const source=invite?'referral':link?.source||'direct_unknown';
      const previous=existingId ? (await sql`SELECT * FROM visitors WHERE id=${existingId} AND workspace_id=${workspaceId}`)[0] : null;
      const visitorId=previous?.id||id();
      if(previous) {
        if(link || invite) await sql`UPDATE visitors SET first_link_id=CASE WHEN first_source='direct_unknown' THEN ${link?.id||null} ELSE first_link_id END, first_source=CASE WHEN first_source='direct_unknown' THEN ${source} ELSE first_source END, last_link_id=${link?.id||null},last_source=${source},last_seen_at=now() WHERE id=${visitorId}`;
        else await sql`UPDATE visitors SET last_seen_at=now() WHERE id=${visitorId}`;
      } else await sql`INSERT INTO visitors(id,workspace_id,first_link_id,last_link_id,first_source,last_source) VALUES(${visitorId},${workspaceId},${link?.id||null},${link?.id||null},${source},${source})`;
      for(const experiment of ['preview','takehome']) await sql`INSERT INTO exposures(visitor_id,experiment_id,arm) VALUES(${visitorId},${experiment},${arm(visitorId,experiment)}) ON CONFLICT DO NOTHING`;
      await logEvent(workspaceId,visitorId,invite?'invite_open':'visit',{source});
      return NextResponse.json({visitorId,source,attributionWarning:source==='direct_unknown',inviteValid:!!invite});
    }
    if(path[0]==='registrations' && path.length===1) {
      const workspaceId=plain(data.workspaceId), visitorId=plain(data.visitorId), branch=plain(data.branch), year=Number(data.graduationYear), inviteToken=plain(data.inviteToken);
      if(!validEmail(data.email)) return error(422,'fictional_email_only','Use a fictional address ending in @example.com. No email will be sent.');
      if(!BRANCHES.includes(branch as typeof BRANCHES[number])) return error(422,'unsupported_branch',`Choose an engineering branch: ${BRANCHES.join(', ')}.`);
      if(!Number.isInteger(year) || year<2025 || year>2032) return error(422,'invalid_year','Choose a valid graduation year.');
      if(data.acknowledge!==true) return error(422,'acknowledgement_required','Confirm that this is a fictional assessment simulation.');
      const w=await workspace(workspaceId); if(!w) return error(404,'workspace_missing','This workspace has expired.');
      const visitor=(await sql`SELECT * FROM visitors WHERE id=${visitorId} AND workspace_id=${workspaceId}`)[0];
      if(!visitor) return error(404,'visitor_missing','Start a demo visit before registration.');
      const count=await sql`SELECT count(*)::int AS n FROM registrations WHERE workspace_id=${workspaceId}`;
      if(Number(count[0].n)>=1000) return error(429,'workspace_full','This demo has reached its registration limit.');
      const mailHash=emailDigest(String(data.email));
      let invite=null;
      if(inviteToken) {
        invite=(await sql`SELECT i.id,i.inviter_registration_id,r.email_digest FROM invites i JOIN registrations r ON r.id=i.inviter_registration_id WHERE i.token_digest=${digest(inviteToken)} AND i.workspace_id=${workspaceId} AND i.expires_at>now()`)[0]||null;
        if(invite && invite.email_digest===mailHash) return error(422,'self_referral','An inviter cannot register as their own friend. Use a different fictional identity.');
      }
      const duplicate=(await sql`SELECT id FROM registrations WHERE workspace_id=${workspaceId} AND email_digest=${mailHash}`)[0];
      if(duplicate) return error(409,'duplicate','This fictional address already has a demo registration in this workspace.');
      const registrationId=id(), eligible=year===Number(w.target_year);
      const inserted=await sql`INSERT INTO registrations(id,workspace_id,visitor_id,email_digest,graduation_year,branch,eligible,first_link_id,last_link_id,first_source,last_source) VALUES(${registrationId},${workspaceId},${visitorId},${mailHash},${year},${branch},${eligible},${visitor.first_link_id},${visitor.last_link_id},${visitor.first_source},${visitor.last_source}) ON CONFLICT(workspace_id,workshop_id,email_digest) DO NOTHING RETURNING id`;
      if(!inserted.length) return error(409,'duplicate','This fictional address already has a demo registration in this workspace.');
      await sql`INSERT INTO exposures(visitor_id,experiment_id,arm) VALUES(${visitorId},'friend',${arm(visitorId,'friend')}) ON CONFLICT DO NOTHING`;
      if(invite && eligible) await sql`INSERT INTO referrals(invite_id,invitee_registration_id,primary_or_assist) VALUES(${invite.id},${registrationId},${visitor.first_source==='referral'?'primary':'assist'}) ON CONFLICT DO NOTHING`;
      await logEvent(workspaceId,visitorId,'registration',{eligible,branch,referralCredited:!!invite&&eligible});
      return NextResponse.json({registrationId,eligible,graduationYear:year,referralCredited:!!invite&&eligible,message:'Fictional demo receipt. No email sent.'},{status:201});
    }
    if(path[0]==='invites' && path.length===1) {
      const workspaceId=plain(data.workspaceId), registrationId=plain(data.registrationId);
      const r=(await sql`SELECT id,branch FROM registrations WHERE id=${registrationId} AND workspace_id=${workspaceId}`)[0];
      if(!r) return error(404,'registration_missing','Complete a demo registration first.');
      const existing=await sql`SELECT count(*)::int AS n FROM invites WHERE inviter_registration_id=${registrationId}`;
      if(Number(existing[0].n)>=20) return error(429,'invite_limit','This demo registration has reached its invite limit.');
      const inviteToken=token(), inviteId=id();
      await sql`INSERT INTO invites(id,workspace_id,inviter_registration_id,token_digest,expires_at) VALUES(${inviteId},${workspaceId},${registrationId},${digest(inviteToken)},now()+interval '7 days')`;
      await logEvent(workspaceId,null,'invite_issued',{});
      return NextResponse.json({inviteUrl:`${base(req)}/w/${workspaceId}?invite=${inviteToken}`,inviterBranch:r.branch,expiresInDays:7},{status:201});
    }
    if(path[0]==='invites' && path.length===3 && path[2]==='accept') {
      const inviteToken=path[1], workspaceId=plain(data.workspaceId);
      if(!validAnswers(data.answers)) return error(422,'invalid_answers',`Choose a supported engineering branch: ${BRANCHES.join(', ')}.`);
      const rows=await sql`SELECT r.branch,rec.level,rec.interests,rec.outcome FROM invites i JOIN registrations r ON r.id=i.inviter_registration_id LEFT JOIN LATERAL (SELECT level,interests,outcome FROM recommendations WHERE visitor_id=r.visitor_id ORDER BY shown_at DESC LIMIT 1) rec ON true WHERE i.token_digest=${digest(inviteToken)} AND i.workspace_id=${workspaceId} AND i.expires_at>now()`;
      if(!rows.length) return error(404,'invite_invalid','This invite is invalid or expired. You can continue through the normal demo path.');
      const first:Answers={branch:rows[0].branch,level:rows[0].level||'beginner',interests:rows[0].interests||[],outcome:rows[0].outcome||'curious'};
      return NextResponse.json({pair:pairProject(first,data.answers as Answers),inviterBranch:first.branch});
    }
    if(path[0]==='links' && path.length===1) {
      const workspaceId=plain(data.workspaceId);
      if(!await operator(workspaceId,req.headers.get('x-operator-token'))) return error(403,'operator_required','Growth desk access requires the operator link.');
      const source=plain(data.source), medium=plain(data.medium), partner=plain(data.partnerId), campus=plain(data.campusId), variant=plain(data.creativeVariant)||'standard';
      if(!['club','academic','creator','calendar','referral'].includes(source) || !['group','email','classroom','social','newsletter','direct'].includes(medium) || partner.length>60 || campus.length>60 || variant.length>60) return error(422,'invalid_link','Choose a valid source and medium; keep labels under 60 characters.');
      const count=await sql`SELECT count(*)::int AS n FROM campaign_links WHERE workspace_id=${workspaceId}`;
      if(Number(count[0].n)>=50) return error(429,'link_limit','This demo has reached its link limit.');
      const linkId=id();
      await sql`INSERT INTO campaign_links(id,workspace_id,source,medium,partner_id,campus_id,creative_variant) VALUES(${linkId},${workspaceId},${source},${medium},${partner},${campus},${variant})`;
      return NextResponse.json({linkId,shareUrl:`${base(req)}/w/${workspaceId}?link=${linkId}`,source,medium,partnerId:partner,campusId:campus,creativeVariant:variant},{status:201});
    }
    if(path[0]==='demo-workspaces' && path.length===3 && path[2]==='reset') {
      const workspaceId=path[1];
      if(!await operator(workspaceId,req.headers.get('x-operator-token'))) return error(403,'operator_required','Growth desk access requires the operator link.');
      await sql`DELETE FROM referrals WHERE invite_id IN (SELECT id FROM invites WHERE workspace_id=${workspaceId})`;
      await sql`DELETE FROM invites WHERE workspace_id=${workspaceId}`;
      await sql`DELETE FROM registrations WHERE workspace_id=${workspaceId}`;
      await sql`DELETE FROM events WHERE workspace_id=${workspaceId}`;
      await sql`DELETE FROM visitors WHERE workspace_id=${workspaceId}`;
      await sql`DELETE FROM campaign_links WHERE workspace_id=${workspaceId}`;
      const seeded=data.seedMode===true;
      await sql`UPDATE demo_workspaces SET seed_mode=${seeded} WHERE id=${workspaceId}`;
      if(seeded) await seed(workspaceId);
      return NextResponse.json({workspaceId,seeded,message:seeded?'Workspace reseeded with synthetic records.':'Workspace reset to empty.'});
    }
    return error(404,'not_found','Unknown API route.');
  } catch(e) { console.error('API failure',e instanceof Error?e.message:'unknown'); return error(500,'server_error','The demo service could not complete this request. Please retry.'); }
}

export async function GET(req:NextRequest,ctx:Context) {
  const path=(await ctx.params).path;
  try {
    await ensureSchema();
    const sql=db();
    if(path[0]==='projects') return NextResponse.json({projects:PROJECTS});
    if(path[0]==='dashboard' || path[0]==='export.csv') {
      const workspaceId=req.nextUrl.searchParams.get('workspaceId')||'';
      if(!await operator(workspaceId,req.headers.get('x-operator-token'))) return error(403,'operator_required','Growth desk access requires the operator link.');
      const w=await workspace(workspaceId);
      const totals=(await sql`SELECT count(*)::int AS registrations,count(*) FILTER(WHERE eligible)::int AS eligible,count(*) FILTER(WHERE NOT eligible)::int AS other_year FROM registrations WHERE workspace_id=${workspaceId}`)[0];
      const visitors=(await sql`SELECT count(*)::int AS visitors FROM visitors WHERE workspace_id=${workspaceId}`)[0];
      const channel=await sql`SELECT v.first_source AS source,count(DISTINCT v.id)::int AS visitors,count(DISTINCT e.visitor_id) FILTER(WHERE e.type='form_start')::int AS form_starts,count(DISTINCT r.id) FILTER(WHERE r.eligible)::int AS eligible,count(DISTINCT r.id) FILTER(WHERE r.eligible AND r.synthetic)::int AS synthetic_eligible FROM visitors v LEFT JOIN events e ON e.visitor_id=v.id LEFT JOIN registrations r ON r.visitor_id=v.id WHERE v.workspace_id=${workspaceId} GROUP BY v.first_source ORDER BY v.first_source`;
      const lastTouch=await sql`SELECT last_source AS source,count(*)::int AS eligible FROM registrations WHERE workspace_id=${workspaceId} AND eligible=true GROUP BY last_source ORDER BY last_source`;
      const referral=(await sql`SELECT (SELECT count(*) FROM invites WHERE workspace_id=${workspaceId})::int AS issued,(SELECT count(*) FROM events WHERE workspace_id=${workspaceId} AND type='invite_open')::int AS opens,(SELECT count(*) FROM referrals f JOIN registrations r ON r.id=f.invitee_registration_id WHERE r.workspace_id=${workspaceId})::int AS valid,(SELECT count(*) FROM referrals f JOIN registrations r ON r.id=f.invitee_registration_id WHERE r.workspace_id=${workspaceId} AND f.primary_or_assist='primary')::int AS primary,(SELECT count(*) FROM referrals f JOIN registrations r ON r.id=f.invitee_registration_id WHERE r.workspace_id=${workspaceId} AND f.primary_or_assist='assist')::int AS assists`)[0];
      const experiments=await sql`SELECT x.experiment_id,x.arm,count(DISTINCT x.visitor_id)::int AS exposed,count(DISTINCT CASE WHEN x.experiment_id='friend' THEN f.invitee_registration_id ELSE r.id END) FILTER(WHERE CASE WHEN x.experiment_id='friend' THEN friend.eligible ELSE r.eligible END)::int AS eligible FROM exposures x JOIN visitors v ON v.id=x.visitor_id LEFT JOIN registrations r ON r.visitor_id=v.id LEFT JOIN invites i ON i.inviter_registration_id=r.id LEFT JOIN referrals f ON f.invite_id=i.id LEFT JOIN registrations friend ON friend.id=f.invitee_registration_id WHERE v.workspace_id=${workspaceId} GROUP BY x.experiment_id,x.arm ORDER BY x.experiment_id,x.arm`;
      const links=await sql`SELECT id,source,medium,partner_id,campus_id,creative_variant,synthetic,created_at FROM campaign_links WHERE workspace_id=${workspaceId} ORDER BY created_at DESC`;
      const events=await sql`SELECT type,at,metadata,synthetic FROM events WHERE workspace_id=${workspaceId} ORDER BY at DESC LIMIT 30`;
      const results={workspaceId,seeded:w.seed_mode,expiresAt:w.expires_at,targetYear:w.target_year,totals:{...totals,visitors:visitors.visitors},channel,lastTouch,referral,experiments,links,events,disclosure:'SIMULATED DATA / NO CAMPAIGN EXECUTED'};
      if(path[0]==='dashboard') return NextResponse.json(results);
      const escape=(v:unknown)=>{const s=String(v??'');const safe=/^[=+\-@\t\r]/.test(s)?`'${s}`:s;return `"${safe.replaceAll('"','""')}"`};
      const rows=[['source','visitors','form_starts','eligible_registrations','synthetic_eligible_registrations'],...channel.map(c=>[c.source,c.visitors,c.form_starts,c.eligible,c.synthetic_eligible])];
      const csv=`# Campus Relay assessment simulation; no campaign executed\r\n# Workspace ${workspaceId}; generated ${new Date().toISOString()}\r\n`+rows.map(r=>r.map(escape).join(',')).join('\r\n');
      return new NextResponse(csv,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="campus-relay-demo.csv"','x-content-type-options':'nosniff'}});
    }
    return error(404,'not_found','Unknown API route.');
  } catch(e) { console.error('API failure',e instanceof Error?e.message:'unknown'); return error(500,'server_error','The demo service could not complete this request. Please retry.'); }
}
