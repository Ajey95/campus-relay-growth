'use client';
import { useState } from 'react';
import { api } from '@/lib/client';

export default function Home() {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function create(seedMode:boolean) {
    setBusy(true);setError('');
    try {
      const result=await api<{workspaceId:string;operatorUrl:string;studentUrl:string}>('demo-workspaces',{method:'POST',body:{seedMode}});
      localStorage.setItem(`campus-relay-operator-${result.workspaceId}`,new URL(result.operatorUrl).hash.replace('#operator=',''));
      window.location.href=result.studentUrl;
    } catch(e) {setError(e instanceof Error?e.message:'Could not create workspace.');setBusy(false)}
  }
  return <main className="home-shell">
    <header className="site-header"><strong>Campus <span>Relay</span></strong><span>Independent assessment simulation</span></header>
    <section className="home-main">
      <div className="home-intro"><h1>Build Your First AI Project in 60 Minutes</h1><p>A free online workshop proposal for final-year engineering students. Explore one small project starter, then try a fictional registration and optional friend invite.</p><div className="offer-details"><span>Free</span><span>Online</span><span>60 minutes</span><span>Date, time and instructor to be confirmed</span></div></div>
      <div className="home-actions"><h2>Open a demo workspace</h2><p>Each workspace keeps its own simulated records for seven days. Your Growth desk link is saved in this browser and can be copied from the student view.</p><button className="primary" onClick={()=>create(false)} disabled={busy}>Create an empty workspace <span aria-hidden="true">→</span></button><button className="secondary" onClick={()=>create(true)} disabled={busy}>Create a seeded workspace</button>{error&&<p className="error" role="alert">{error}</p>}<p className="fine">Seeded records are synthetic examples. No students are contacted, no email is sent, and no campaign has been run.</p></div>
    </section>
    <section className="home-bottom"><div><h2>For the student</h2><p>Choose a branch, level and interests; see a scoped project before entering a fictional email.</p></div><div><h2>For the growth reviewer</h2><p>Inspect source attribution, unique eligible counts, experiment denominators and a forecast separate from the demo records.</p><p><a href="/assets/Campus_Relay_Growth_Plan.pdf">Read the two-page growth plan ↗</a> &nbsp; <a href="/assets/AI_Worklog.md">Read the AI worklog ↗</a></p></div></section>
  </main>;
}
