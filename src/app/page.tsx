'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function Home() {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function create(destination:'student'|'desk') {
    setBusy(true);setError('');
    try {
      const result=await api<{workspaceId:string;operatorUrl:string;studentUrl:string}>('demo-workspaces',{method:'POST',body:{seedMode:destination==='desk'}});
      localStorage.setItem(`campus-relay-operator-${result.workspaceId}`,new URL(result.operatorUrl).hash.replace('#operator=',''));
      window.location.href=destination==='desk'?result.operatorUrl:result.studentUrl;
    } catch(e) {setError(e instanceof Error?e.message:'Could not create workspace.');setBusy(false)}
  }
  return <main className="home-shell">
    <header className="site-header"><strong>Campus <span>Relay</span></strong><span>Independent assessment simulation</span></header>
    <section className="home-main">
      <div className="home-intro"><h1>Build Your First AI Project in 60 Minutes</h1><p>A free online workshop proposal for final-year engineering students. Explore one small project starter, then try a fictional registration and optional friend invite.</p><div className="offer-details"><span>Free</span><span>Online</span><span>60 minutes</span><span>Date, time and instructor to be confirmed</span></div></div>
      <div className="home-actions"><h2>Choose a demo</h2><p>Each option creates its own seven-day workspace. You can switch between the student view and Growth desk inside either one.</p><button className="primary" onClick={()=>create('student')} disabled={busy}>Try student registration <span aria-hidden="true">→</span></button><p className="demo-caption">Start with an empty workspace and answer the project chat.</p><button className="secondary" onClick={()=>create('desk')} disabled={busy}>Explore admin Growth desk <span aria-hidden="true">→</span></button><p className="demo-caption">Open the source dashboard with clearly labelled synthetic records.</p>{error&&<p className="error" role="alert">{error}</p>}<p className="fine">No students are contacted, no email is sent, and no campaign has been run.</p></div>
    </section>
    <section className="home-bottom"><div><h2>For the student</h2><p>Answer a short project chat, see three tailored proposals, and create a fictional receipt.</p></div><div><h2>For the growth reviewer</h2><p>Inspect registration sources, unique eligible counts, experiment denominators and a forecast separate from the demo records.</p><p><a href="/assets/Campus_Relay_Growth_Plan.pdf">Read the two-page growth plan ↗</a> &nbsp; <a href="/assets/AI_Worklog.md">Read the AI worklog ↗</a></p></div></section>
  </main>;
}
