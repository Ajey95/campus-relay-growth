'use client';
import { useEffect, useRef, useState } from 'react';
import { Answers, BRANCHES, Branch } from '@/lib/catalog';
import { BRANCH_HINTS, BUILD_STYLES, CHALLENGES } from '@/lib/quiz';

type Props={answers:Answers;onChange:(next:Answers)=>void;onReveal:(answers:Answers)=>void;onCurated:(answers:Answers)=>void;busy:boolean;ready:boolean};
const GOALS=[
  {id:'interview',title:'A story I can explain',detail:'A concrete project I can walk someone through.'},
  {id:'useful',title:'A useful little tool',detail:'A prototype that might help someone.'},
  {id:'curious',title:'A surprising discovery',detail:'Something that makes me want to explore more.'},
] as const;
const LEVELS=[
  {id:'beginner',title:'I’m new to this',detail:'Start with a clear first win.'},
  {id:'intermediate',title:'I’ve built a little before',detail:'Give me a meaningful choice to make.'},
] as const;

export default function MatchmakerQuiz({answers,onChange,onReveal,onCurated,busy,ready}:Props) {
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState('');
  const [goalChosen,setGoalChosen]=useState(false);
  const conversation=useRef<HTMLDivElement>(null);
  const chosen=CHALLENGES[answers.branch].find(c=>c.id===answers.challenge);
  const spark=answers.challenge==='own'?answers.idea?.trim():chosen?.title;
  const displaySpark=spark?.replace(/[.!?]+$/,'');
  const style=BUILD_STYLES.find(s=>s.id===answers.buildStyle);
  const stylePayoff=answers.buildStyle==='visual'?'a visual story':answers.buildStyle==='tool'?'a useful tool':'an interactive prototype';
  const goal=GOALS.find(g=>g.id===answers.outcome);
  const questions=[
    'First, which engineering world feels most like yours?',
    `Nice. In ${answers.branch}, what problem keeps catching your eye?`,
    `I can picture “${displaySpark||'that idea'}.” What would be fun to make from it?`,
    'Let’s keep it achievable. Where are you starting today?',
    'Last one: what would make this hour feel worthwhile to you?',
  ];
  const replies=[answers.branch,spark,style?.title,LEVELS.find(l=>l.id===answers.level)?.title,goal?.title];
  const acknowledgements=[
    `${answers.branch} gives us a starting lens.`,
    answers.challenge==='own'?'That’s a good spark. I’ll keep your own words at the center.':`That gives us a direction inside ${answers.branch}.`,
    `Got it — we’ll aim for something ${answers.buildStyle==='visual'?'you can see':answers.buildStyle==='tool'?'someone can use':'someone can try'}.`,
    answers.level==='beginner'?'We’ll keep the first step friendly.':'We can leave room for one thoughtful trade-off.',
  ];
  useEffect(()=>{if(conversation.current)conversation.current.scrollTop=conversation.current.scrollHeight},[step,busy]);
  function chooseBranch(branch:Branch) {onChange({...answers,branch,challenge:undefined,idea:'',interests:[],buildStyle:undefined});setGoalChosen(false);setStep(1)}
  function chooseChallenge(id:string) {
    if(id==='own'){onChange({...answers,challenge:id,idea:'',interests:[]});setDraft('');return}
    const selected=CHALLENGES[answers.branch].find(c=>c.id===id);
    onChange({...answers,challenge:id,idea:'',interests:selected?[selected.interest]:[]});setStep(2);
  }
  function submitIdea(event:React.FormEvent) {
    event.preventDefault();const idea=draft.trim();if(idea.length<6)return;
    onChange({...answers,challenge:'own',idea,interests:[]});setStep(2);
  }
  function chooseStyle(id:Answers['buildStyle']) {onChange({...answers,buildStyle:id});setStep(3)}
  function chooseLevel(level:Answers['level']) {onChange({...answers,level});setGoalChosen(false);setStep(4)}
  const options=step===0?BRANCHES.map(branch=>({id:branch,title:branch,detail:BRANCH_HINTS[branch]})):
    step===1?[...CHALLENGES[answers.branch].map(c=>({id:c.id,title:c.title,detail:c.detail})),{id:'own',title:'I have my own idea',detail:'Type it in your words.'}]:
    step===2?BUILD_STYLES:step===3?LEVELS:GOALS;
  function select(id:string) {
    if(step===0)chooseBranch(id as Branch);
    else if(step===1)chooseChallenge(id);
    else if(step===2)chooseStyle(id as Answers['buildStyle']);
    else if(step===3)chooseLevel(id as Answers['level']);
    else {onChange({...answers,outcome:id as Answers['outcome']});setGoalChosen(true)}
  }
  return <div className="chat-discovery">
    <div className="chat-heading"><div><h2>Let’s find your project</h2><p>Tell me a little about what interests you. I’ll connect the dots into three first builds.</p></div><span>{step+1} of 5</span></div>
    <div className="chat-progress" aria-label={`Question ${step+1} of 5`}>{[0,1,2,3,4].map(i=><span key={i} className={i<=step?'active':''}/>)}</div>
    <div ref={conversation} className="chat-window" aria-label="Project discovery conversation" aria-live="polite">
      <div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><strong>Campus Relay</strong><p>Hi! There’s no perfect answer here. We’re just looking for a project that feels like yours.</p></div></div>
      {Array.from({length:step},(_,i)=><div className="chat-turn" key={i}>
        <div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><p>{questions[i]}</p></div></div>
        <div className="chat-entry student"><div className="chat-bubble"><p>{replies[i]}</p></div></div>
        <div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble aside"><p>{acknowledgements[i]}</p></div></div>
      </div>)}
      <div className="chat-entry assistant current"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><p>{questions[step]}</p>{step===4&&goalChosen&&<p className="chat-summary">You know {answers.branch}, you’re drawn to “{displaySpark},” and you want {stylePayoff}. I have enough to make this personal.</p>}</div></div>
      {step===4&&goalChosen&&<div className="chat-entry student"><div className="chat-bubble"><p>{goal?.title}</p></div></div>}
    </div>
    <div className="chat-composer"><span className="chat-composer-label">{step===1?'Choose one, or tell me your own idea':'Choose a reply'}</span><div className="chat-replies">{options.map(option=><button key={option.id} type="button" data-testid={`reply-${option.id}`} className={step===4&&goalChosen&&answers.outcome===option.id?'chat-reply selected':'chat-reply'} onClick={()=>select(option.id)} disabled={busy}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div>
      {step===1&&answers.challenge==='own'&&<form className="chat-idea" onSubmit={submitIdea}><label htmlFor="own-idea">What’s your idea?</label><div><textarea id="own-idea" maxLength={240} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Could we spot water waste in a hostel from sample meter readings?"/><button className="primary" disabled={draft.trim().length<6}>Send →</button></div><p className="fine">Use an idea, not personal details. {draft.length}/240</p></form>}
      {step===4&&goalChosen&&<div className="chat-reveal"><button type="button" className="primary" disabled={!ready||busy} onClick={()=>onReveal(answers)}>{busy?'Connecting your answers…':'Reveal my project paths ✦'}</button><p className="fine">AI proposals use synthetic inputs. Workshop details are still to be confirmed.</p></div>}
      <div className="chat-actions"><button type="button" className="text-button" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0||busy}>← Previous question</button><button type="button" className="text-button" onClick={()=>onCurated(answers)} disabled={!ready||busy}>Browse curated examples</button></div>
    </div>
  </div>;
}
