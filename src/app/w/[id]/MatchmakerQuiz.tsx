'use client';
import { useEffect, useRef, useState } from 'react';
import { Answers, BRANCHES, Branch } from '@/lib/catalog';
import { api } from '@/lib/client';
import type { InterviewQuestion, InterviewTurn } from '@/lib/interview';
import { BRANCH_HINTS, BUILD_STYLES, CHALLENGES } from '@/lib/quiz';

type FollowUp=InterviewQuestion & {answer?:string};
type Props={workspaceId:string;visitorId:string;answers:Answers;onChange:(next:Answers)=>void;onReveal:(answers:Answers)=>void;onCurated:(answers:Answers)=>void;busy:boolean;ready:boolean};
const GOALS=[
  {id:'interview',title:'A story I can explain',detail:'A concrete project I can walk someone through.'},
  {id:'useful',title:'A useful little tool',detail:'A prototype that might help someone.'},
  {id:'curious',title:'A surprising discovery',detail:'Something that makes me want to explore more.'},
] as const;
const LEVELS=[
  {id:'beginner',title:'I’m new to this',detail:'Start with a clear first win.'},
  {id:'intermediate',title:'I’ve built a little before',detail:'Give me a meaningful choice to make.'},
] as const;

export default function MatchmakerQuiz({workspaceId,visitorId,answers,onChange,onReveal,onCurated,busy,ready}:Props) {
  const [step,setStep]=useState(0);
  const [ownDraft,setOwnDraft]=useState('');
  const [draft,setDraft]=useState('');
  const [followUps,setFollowUps]=useState<FollowUp[]>([]);
  const [questionBusy,setQuestionBusy]=useState(false);
  const [questionNotice,setQuestionNotice]=useState('');
  const [goalChosen,setGoalChosen]=useState(false);
  const conversation=useRef<HTMLDivElement>(null);
  const chosen=CHALLENGES[answers.branch].find(c=>c.id===answers.challenge);
  const spark=answers.challenge==='own'?answers.idea?.trim():chosen?.title;
  const displaySpark=spark?.replace(/[.!?]+$/,'');
  const style=BUILD_STYLES.find(s=>s.id===answers.buildStyle);
  const goal=GOALS.find(g=>g.id===answers.outcome);
  useEffect(()=>{if(conversation.current)conversation.current.scrollTop=conversation.current.scrollHeight},[step,questionBusy,goalChosen]);

  async function ask(turn:0|1,next:Answers,history:InterviewTurn[]) {
    setQuestionBusy(true);setQuestionNotice('');
    let result:InterviewQuestion;
    try {
      if(!visitorId)throw new Error('Visitor not ready');
      result=await api<InterviewQuestion>('interview',{method:'POST',body:{workspaceId,visitorId,interview:{branch:next.branch,challenge:next.challenge,idea:next.idea,turn,history}}});
    } catch {
      result=turn===0?
        {acknowledgement:`${next.branch} gives us a useful starting point.`,question:'Who would use this idea, and what small example could we use to try it safely?',mode:'guided'}:
        {acknowledgement:'That helps narrow the first build.',question:'What visible result could you show after one hour with a tiny fictional input?',mode:'guided'};
      setQuestionNotice('The live question was unavailable, so a guided question is shown.');
    }
    setFollowUps(previous=>turn===0?[result]:[previous[0],result]);
    setStep(turn+2);setDraft('');setQuestionBusy(false);
  }
  function chooseBranch(branch:Branch) {
    onChange({...answers,branch,challenge:undefined,idea:'',interests:[],buildStyle:undefined,conversation:[]});
    setFollowUps([]);setQuestionNotice('');setGoalChosen(false);setStep(1);
  }
  function chooseChallenge(id:string) {
    if(id==='own'){onChange({...answers,challenge:'own',idea:'',interests:[],conversation:[]});setOwnDraft('');return}
    const selected=CHALLENGES[answers.branch].find(c=>c.id===id);
    const next={...answers,challenge:id,idea:'',interests:selected?[selected.interest]:[],conversation:[]} as Answers;
    onChange(next);void ask(0,next,[]);
  }
  function submitIdea(event:React.FormEvent) {
    event.preventDefault();const idea=ownDraft.trim();if(idea.length<6)return;
    const next={...answers,challenge:'own',idea,interests:[],conversation:[]};
    onChange(next);void ask(0,next,[]);
  }
  function submitFollowUp(event:React.FormEvent) {
    event.preventDefault();const answer=draft.trim();if(answer.length<6)return;
    const index=step-2,question=followUps[index]?.question;
    if(!question)return;
    const history=[...(answers.conversation||[]).slice(0,index),{question,answer}];
    const next={...answers,conversation:history};onChange(next);
    setFollowUps(previous=>previous.map((item,i)=>i===index?{...item,answer}:item));
    if(index===0)void ask(1,next,history);
    else {setDraft('');setQuestionNotice('');setStep(4)}
  }
  const choiceOptions=step===0?BRANCHES.map(branch=>({id:branch,title:branch,detail:BRANCH_HINTS[branch]})):
    step===1?[...CHALLENGES[answers.branch].map(c=>({id:c.id,title:c.title,detail:c.detail})),{id:'own',title:'I have my own idea',detail:'Tell me in your own words.'}]:
    step===4?BUILD_STYLES:step===5?LEVELS:step===6?GOALS:[];
  function select(id:string) {
    if(step===0)chooseBranch(id as Branch);
    else if(step===1)chooseChallenge(id);
    else if(step===4){onChange({...answers,buildStyle:id as Answers['buildStyle']});setStep(5)}
    else if(step===5){onChange({...answers,level:id as Answers['level']});setGoalChosen(false);setStep(6)}
    else if(step===6){onChange({...answers,outcome:id as Answers['outcome']});setGoalChosen(true)}
  }
  const userBubble=(value:string|undefined,key:string)=><div className="chat-entry student" key={key}><div className="chat-bubble"><p>{value}</p></div></div>;
  const assistantBubble=(value:string|undefined,key:string,tag?:string)=><div className="chat-entry assistant" key={key}><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble">{tag&&<strong data-testid="interview-mode">{tag}</strong>}<p>{value||''}</p></div></div>;
  return <div className="chat-discovery">
    <div className="chat-heading"><div><h2>Let’s find your project</h2><p>Tell me what you’re imagining. I’ll ask two follow-ups, then shape three first builds around your replies.</p></div><span>{step+1} of 7</span></div>
    <div className="chat-progress" aria-label={`Question ${step+1} of 7`}>{[0,1,2,3,4,5,6].map(i=><span key={i} className={i<=step?'active':''}/>)}</div>
    <div ref={conversation} className="chat-window" aria-label="Project discovery conversation" aria-live="polite">
      {assistantBubble('Hi! Let’s find a project starter that could make the proposed free 60-minute AI workshop worth your time. These are previews, not a confirmed syllabus.','intro','Campus Relay')}
      {assistantBubble('First, which engineering world feels most like yours?','branch-question')}
      {step>=1&&<>{userBubble(answers.branch,'branch-reply')}{assistantBubble(`In ${answers.branch}, what problem keeps catching your eye?`,'spark-question')}</>}
      {step>=2&&<>{userBubble(spark,'spark-reply')}{assistantBubble(followUps[0]?.acknowledgement,'first-ack')}{assistantBubble(followUps[0]?.question,'first-followup',followUps[0]?.mode==='ai'?'AI follow-up':'Guided follow-up')}</>}
      {step>=3&&<>{userBubble(followUps[0]?.answer,'first-reply')}{assistantBubble(followUps[1]?.acknowledgement,'second-ack')}{assistantBubble(followUps[1]?.question,'second-followup',followUps[1]?.mode==='ai'?'AI follow-up':'Guided follow-up')}</>}
      {step>=4&&<>{userBubble(followUps[1]?.answer,'second-reply')}{assistantBubble(`I can see a first build for “${displaySpark}.” How would you like to bring it to life?`,'style-question')}</>}
      {step>=5&&<>{userBubble(style?.title,'style-reply')}{assistantBubble('Where are you starting today? I’ll keep the first hour realistic.','level-question')}</>}
      {step>=6&&<>{userBubble(LEVELS.find(l=>l.id===answers.level)?.title,'level-reply')}{assistantBubble('Last one: what would make this hour worth it to you?','goal-question')}</>}
      {step===6&&goalChosen&&<>{userBubble(goal?.title,'goal-reply')}{assistantBubble(`I heard your idea, the people or setting you described, and the first result you want. I’m ready to connect those details.`, 'summary')}</>}
      {questionBusy&&assistantBubble('Thinking of one useful follow-up…','thinking')}
    </div>
    <div className="chat-composer"><span className="chat-composer-label">{step===1?'Choose a spark, or type your own':step===2||step===3?'Reply in your words':'Choose a reply'}</span>
      {choiceOptions.length>0&&<div className="chat-replies">{choiceOptions.map(option=><button key={option.id} type="button" data-testid={`reply-${option.id}`} className={step===6&&goalChosen&&answers.outcome===option.id?'chat-reply selected':'chat-reply'} onClick={()=>select(option.id)} disabled={busy||questionBusy||(step===1&&!ready)}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div>}
      {step===1&&answers.challenge==='own'&&<form className="chat-idea" onSubmit={submitIdea}><label htmlFor="own-idea">What’s your idea?</label><div><textarea id="own-idea" maxLength={240} rows={2} value={ownDraft} onChange={e=>setOwnDraft(e.target.value)} placeholder="Could we spot water waste in a hostel from sample meter readings?"/><button className="primary" disabled={ownDraft.trim().length<6||questionBusy||!ready}>Send →</button></div><p className="fine">Use an idea, not personal details. {ownDraft.length}/240</p></form>}
      {(step===2||step===3)&&<form className="chat-idea" onSubmit={submitFollowUp}><label htmlFor="followup-answer">Your reply</label><div><textarea id="followup-answer" maxLength={240} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} disabled={questionBusy} placeholder="A small example or result is enough…"/><button className="primary" disabled={draft.trim().length<6||questionBusy}>Send →</button></div><p className="fine">{draft.length}/240 · Please avoid names, private data or contact details.</p></form>}
      {questionNotice&&<p className="fine" role="status">{questionNotice}</p>}
      {step===6&&goalChosen&&<div className="chat-reveal"><button type="button" className="primary" disabled={!ready||busy} onClick={()=>onReveal(answers)}>{busy?'Connecting your answers…':'Reveal my project paths ✦'}</button><p className="fine">AI proposals use synthetic inputs. Workshop details are still to be confirmed.</p></div>}
      <div className="chat-actions"><button type="button" className="text-button" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0||busy||questionBusy}>← Previous question</button><button type="button" className="text-button" onClick={()=>onCurated(answers)} disabled={!ready||busy||questionBusy}>Browse curated examples</button></div>
    </div>
  </div>;
}
