'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Answers, PairProject, Project } from '@/lib/catalog';
import { api } from '@/lib/client';
import { STARTER_FILES } from '@/lib/starters';
import MatchmakerQuiz from './MatchmakerQuiz';
import RegistrationChat from './RegistrationChat';

type Match={primary:Project;alternatives:Project[];options:Project[];reason:string;mode:'ai'|'curated'};
type Receipt={registrationId:string;eligible:boolean;message:string;referralCredited:boolean};
const initial:Answers={branch:'CSE',level:'beginner',interests:[],outcome:'interview',idea:''};

export default function Student() {
  const {id:workspaceId}=useParams<{id:string}>();
  const [visitorId,setVisitorId]=useState(''),[inviteToken,setInviteToken]=useState(''),[inviteValid,setInviteValid]=useState(false),[source,setSource]=useState('direct_unknown');
  const [answers,setAnswers]=useState<Answers>(initial),[match,setMatch]=useState<Match|null>(null),[pair,setPair]=useState<PairProject|null>(null);
  const [stage,setStage]=useState<'match'|'project'|'register'|'done'>('match'),[email,setEmail]=useState(''),[year,setYear]=useState(2027),[ack,setAck]=useState(false),[receipt,setReceipt]=useState<Receipt|null>(null);
  const [friendUrl,setFriendUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [deskToken,setDeskToken]=useState('');
  useEffect(()=>{
    const timer=window.setTimeout(()=>{
      setDeskToken(localStorage.getItem(`campus-relay-operator-${workspaceId}`)||'');
      const qs=new URLSearchParams(window.location.search), invite=qs.get('invite')||'', link=qs.get('link')||'';
      setInviteToken(invite);
      const previous=localStorage.getItem(`campus-relay-visitor-${workspaceId}`)||'';
      api<{visitorId:string;source:string;inviteValid:boolean;attributionWarning:boolean}>('visits',{method:'POST',body:{workspaceId,visitorId:previous,linkId:link,inviteToken:invite}})
        .then(v=>{localStorage.setItem(`campus-relay-visitor-${workspaceId}`,v.visitorId);setVisitorId(v.visitorId);setSource(v.source);setInviteValid(v.inviteValid);if(invite&&!v.inviteValid)setNotice('This friend link is invalid or expired. You can still explore and register through the normal demo path.');})
        .catch(e=>setError(e.message));
    },0);
    return()=>window.clearTimeout(timer);
  },[workspaceId]);
  function updateAnswers(next:Answers) {setAnswers(next);setMatch(null);setPair(null);setStage('match');setError('')}
  async function findProject(selected:Answers=answers,curated=false) {
    if(!visitorId) {setError('Connecting to this workspace. Please retry in a moment.');return}
    setBusy(true);setError('');
    try {
      const requestAnswers=curated?{...selected,challenge:undefined,idea:'',buildStyle:undefined}:selected;
      const result=await api<Omit<Match,'options'>>('recommendations',{method:'POST',body:{workspaceId,visitorId,answers:requestAnswers}});
      setMatch({...result,options:[result.primary,...result.alternatives]});setStage('project');
      if(inviteToken&&inviteValid) {
        const pairing=await api<{pair:PairProject}>(`invites/${encodeURIComponent(inviteToken)}/accept`,{method:'POST',body:{workspaceId,answers:selected}});
        setPair(pairing.pair);
      }
    } catch(e){setError(e instanceof Error?e.message:'Could not find a project.')} finally {setBusy(false)}
  }
  function startRegister() {setStage('register');setError('');api('events',{method:'POST',body:{workspaceId,visitorId,type:'form_start'}}).catch(()=>{});}
  async function register(event:React.FormEvent) {
    event.preventDefault();
    if(!/^[a-z0-9._%+-]+@example\.com$/i.test(email.trim())) {setError('Use a fictional @example.com address. No real contact details.');return}
    setBusy(true);setError('');
    try {
      const result=await api<Receipt>('registrations',{method:'POST',body:{workspaceId,visitorId,email:email.trim(),graduationYear:year,branch:answers.branch,acknowledge:ack,inviteToken:inviteValid?inviteToken:''}});
      setReceipt(result);setStage('done');setEmail('');
    } catch(e){setError(e instanceof Error?e.message:'Registration could not be saved. Retry with the same fictional address.')} finally {setBusy(false)}
  }
  async function createInvite() {
    if(!receipt)return;
    setBusy(true);setError('');
    try {const value=await api<{inviteUrl:string}>('invites',{method:'POST',body:{workspaceId,registrationId:receipt.registrationId}});setFriendUrl(value.inviteUrl)}
    catch(e){setError(e instanceof Error?e.message:'Could not issue friend link.')} finally {setBusy(false)}
  }
  async function downloadStarter() {
    if(!match)return;
    const p=match.primary;
    const contents=`# ${p.title}\n\nCampus Relay assessment simulation. This is a proposed starter, not a confirmed workshop syllabus.\n\n## Goal\n${p.intro}\n\n## Input and output\nInput: ${p.input}\nOutput: ${p.output}\n\n## First hour\n${p.steps.map(x=>`- ${x}`).join('\n')}\n\n## Starter materials\n${p.starter.map(x=>`- ${x}`).join('\n')}\n\n## Limitation\n${p.caution}\n\n## Continue\n${p.next}\n`;
    const JSZip=(await import('jszip')).default;
    const zip=new JSZip();zip.file('README.md',contents);
    for(const [name,value] of Object.entries(STARTER_FILES[p.id]||{})) zip.file(name,value);
    const url=URL.createObjectURL(await zip.generateAsync({type:'blob'}));const a=document.createElement('a');a.href=url;a.download=`${p.id}-starter.zip`;a.click();URL.revokeObjectURL(url);
  }
  const primary=match?.primary;
  const suggestions=match?.options||[];
  return <main className="app-shell">
    <header className="site-header"><Link href="/" className="brand">Campus <span>Relay</span></Link><nav><span className="header-note">Assessment simulation</span>{deskToken&&<a href={`/desk/${workspaceId}#operator=${deskToken}`}>Growth desk →</a>}</nav></header>
    <div className="student-intro"><h1>Build Your First AI Project in 60 Minutes</h1><p>Free online workshop proposal for final-year engineering students. Find one small project you could explore with a supplied starter.</p><div className="offer-details"><span>Free</span><span>Online</span><span>60 minutes</span><span>Date, time and instructor to be confirmed</span></div></div>
    <section className="flow-panel" aria-label="Project matchmaker">
      <ol className="steps" aria-label="Progress"><li className={stage==='match'?'active':''}>1 <span>Matchmaker</span></li><li className={stage==='project'?'active':''}>2 <span>Project</span></li><li className={stage==='register'?'active':''}>3 <span>Register</span></li><li className={stage==='done'?'active':''}>4 <span>Take home</span></li></ol>
      {stage==='match'&&<MatchmakerQuiz answers={answers} onChange={updateAnswers} onReveal={next=>findProject(next)} onCurated={next=>findProject(next,true)} busy={busy} ready={!!visitorId}/> }
      {stage==='project'&&primary&&<>
        <h2>{match.mode==='ai'?'Ideas shaped from your words':'Your matched project'}</h2>
        <p className="muted">{match.mode==='ai'?'AI-generated project proposals. Pick one to inspect; verify feasibility yourself.':'Curated project examples.'} The actual workshop curriculum has not been confirmed.</p>
        <div className="suggestion-list" aria-label="Project suggestions">{suggestions.map(project=><button key={project.id} type="button" className={project.id===primary.id?'suggestion selected':'suggestion'} aria-pressed={project.id===primary.id} onClick={()=>setMatch({...match,primary:project})}><strong>{project.title}</strong><span>{project.fit||project.intro}</span></button>)}</div>
        <div className="project-layout"><div><h3>{primary.title}</h3><p>{primary.intro}</p><p className="reason">{primary.fit||match.reason}</p>{primary.showcase&&<p className="showcase"><strong>Your first-hour moment:</strong> {primary.showcase}</p>}<dl><dt>Sample input</dt><dd>{primary.input}</dd><dt>First output</dt><dd>{primary.output}</dd></dl></div><div className="starter"><h3>First-hour path</h3><ol>{primary.steps.map(s=><li key={s}>{s}</li>)}</ol><p><strong>Take home:</strong> {primary.starter.join(', ')}.</p></div></div>
        <p className="caution">Limitation: {primary.caution}</p>{pair&&<div className="pair-block"><h3>Build together: {pair.title}</h3><p>{pair.intro}</p><ul>{pair.roles.map(r=><li key={r}>{r}</li>)}</ul><p><strong>First-hour milestone:</strong> {pair.milestone}</p><p className="fine">{pair.caution}</p></div>}<div className="action-row between"><button className="secondary" onClick={()=>setStage('match')}>Change answers</button><div><button className="secondary" onClick={downloadStarter}>Download starter outline</button><button className="primary" onClick={startRegister}>Continue to demo registration →</button></div></div>
      </>}
      {stage==='register'&&<RegistrationChat email={email} setEmail={setEmail} year={year} setYear={setYear} ack={ack} setAck={setAck} busy={busy} onSubmit={register} onBack={()=>setStage('project')}/> }
      {stage==='done'&&receipt&&<><h2>Demo receipt created</h2><p className="success">{receipt.message}</p><div className="receipt"><div><span>Registration ID</span><strong>{receipt.registrationId.slice(0,12)}</strong></div><div><span>Target eligibility</span><strong>{receipt.eligible?'Eligible fictional record':'Outside 2027 target'}</strong></div><div><span>Primary source</span><strong>{source.replace('_',' / ')}</strong></div></div><p className="fine">No actual registration, attendance or contact occurred.</p><div className="action-row between"><button className="secondary" onClick={downloadStarter}>Download project starter</button><button className="primary" onClick={createInvite} disabled={busy}>{friendUrl?'Create another friend link':'Invite a friend to build together →'}</button></div>{friendUrl&&<div className="invite-result"><label>Copy this friend link<input readOnly value={friendUrl} onFocus={e=>e.target.select()}/></label><button className="secondary" onClick={()=>navigator.clipboard.writeText(friendUrl)}>Copy link</button><p>Draft message: I found a small project starter for {answers.branch}. Pick your engineering branch to see what we could build together in one hour. This is a fictional workshop assessment demo: {friendUrl}</p></div>}</>}
      {notice&&<p className="notice" role="status">{notice}</p>}{error&&<p className="error" role="alert">{error}</p>}
    </section>
    <footer className="site-footer"><p>Independent candidate assessment simulation, built with AI assistance. AI-generated and curated project previews are proposals; workshop logistics and syllabus need organiser approval.</p><p>No actual campaign has been run.</p></footer>
  </main>;
}
