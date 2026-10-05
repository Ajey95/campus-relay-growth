'use client';
import { useEffect, useRef, useState } from 'react';

type Props={email:string;setEmail:(value:string)=>void;year:number;setYear:(value:number)=>void;ack:boolean;setAck:(value:boolean)=>void;busy:boolean;onSubmit:(event:React.FormEvent)=>void;onBack:()=>void};

export default function RegistrationChat({email,setEmail,year,setYear,ack,setAck,busy,onSubmit,onBack}:Props) {
  const [step,setStep]=useState(0);
  const [localError,setLocalError]=useState('');
  const conversation=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(conversation.current)conversation.current.scrollTop=conversation.current.scrollHeight},[step]);
  function nextEmail() {
    if(!/^[a-z0-9._%+-]+@example\.com$/i.test(email.trim())) {setLocalError('Use a fictional @example.com address. No real email is needed.');return}
    setLocalError('');setStep(1);
  }
  return <div className="chat-discovery registration-chat">
    <div className="chat-heading"><div><h2>Make a demo receipt</h2><p>Three short replies, then you can take your project outline and invite a friend.</p></div><span>{step+1} of 3</span></div>
    <div className="chat-progress" aria-label={`Registration question ${step+1} of 3`}>{[0,1,2].map(i=><span key={i} className={i<=step?'active':''}/>)}</div>
    <div ref={conversation} className="chat-window" aria-label="Fictional registration conversation" aria-live="polite">
      <div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><strong>Campus Relay</strong><p>Your project paths are ready. Let’s make a fictional receipt for this assessment demo.</p></div></div>
      <div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><p>What made-up @example.com address should appear on your receipt? We won’t send an email.</p></div></div>
      {step>0&&<><div className="chat-entry student"><div className="chat-bubble"><p>{email}</p></div></div><div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><p>What’s your graduation year?</p></div></div></>}
      {step>1&&<><div className="chat-entry student"><div className="chat-bubble"><p>{year}</p></div></div><div className="chat-entry assistant"><span className="chat-avatar" aria-hidden="true">✦</span><div className="chat-bubble"><p>Last check: you understand this is a simulation with no workshop place or message?</p></div></div></>}
    </div>
    <div className="chat-composer"><span className="chat-composer-label">Your reply</span>
      {step===0&&<div className="registration-reply"><label htmlFor="demo-email">Fictional email at example.com</label><div><input id="demo-email" type="email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} placeholder="student@example.com" onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();nextEmail()}}}/><button type="button" className="primary" onClick={nextEmail}>Continue →</button></div></div>}
      {step===1&&<div className="chat-replies registration-years">{[2026,2027,2028].map(value=><button key={value} type="button" className="chat-reply" onClick={()=>{setYear(value);setStep(2)}}><strong>{value}</strong></button>)}</div>}
      {step===2&&<form onSubmit={onSubmit}><label className="choice check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} required/><span>I understand this is a simulation; no workshop place or email is created.</span></label><p className="fine">Only 2027 engineering registrations count toward this demo’s target. Other years can still receive a receipt.</p><button className="primary" disabled={busy||!ack}>{busy?'Saving…':'Create demo receipt →'}</button></form>}
      {localError&&<p className="error" role="alert">{localError}</p>}
      <div className="chat-actions"><button type="button" className="text-button" onClick={()=>step?setStep(step-1):onBack()} disabled={busy}>← {step?'Previous question':'Back to project'}</button></div>
    </div>
  </div>;
}
