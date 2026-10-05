import { BUILD_STYLES, CHALLENGES, BuildStyle } from '@/lib/quiz';

export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil'] as const;
export const INTERESTS = ['text', 'data', 'images', 'sensors', 'community'] as const;
export type Branch = typeof BRANCHES[number];
export type Interest = typeof INTERESTS[number];
export type Answers = { branch: Branch; level: 'beginner' | 'intermediate'; interests: Interest[]; outcome: 'interview' | 'useful' | 'curious'; idea?: string; challenge?: string; buildStyle?: BuildStyle };

export type Project = {
  id: string; title: string; branches: Branch[]; interests: Interest[]; bestFor:'beginner'|'intermediate';
  intro: string; input: string; output: string; caution: string;
  steps: [string, string, string, string]; starter: string[]; next: string; generated?: boolean; fit?: string; showcase?: string;
};

export const PROJECTS: Project[] = [
  { id:'faq-finder', title:'Campus FAQ finder', branches:['CSE','IT'], interests:['text','community'], bestFor:'beginner', intro:'Search a supplied FAQ and show the matching source entry.', input:'A sample question and a small supplied FAQ file.', output:'A ranked answer with its source line.', caution:'A starter search tool; answers need human checking.', steps:['10 min: inspect the FAQ','15 min: load and clean entries','25 min: rank and show matches','10 min: test three questions'], starter:['sample-faq.csv','README checklist','three test questions'], next:'Add a no-match state and test with more questions.' },
  { id:'sensor-explorer', title:'Sensor reading explorer', branches:['ECE','EEE','CSE','IT'], interests:['sensors','data'], bestFor:'intermediate', intro:'Plot a supplied sensor CSV and highlight readings outside a simple baseline.', input:'A fictional temperature and light sensor CSV.', output:'A small chart with flagged points and a caveat.', caution:'Flags are illustrations, not safety or equipment diagnoses.', steps:['10 min: inspect the CSV','15 min: plot two signals','25 min: add a baseline flag','10 min: explain false alarms'], starter:['sample-sensor.csv','README checklist','baseline notes'], next:'Compare thresholds on another synthetic sample.' },
  { id:'maintenance-notes', title:'Maintenance note explorer', branches:['Mechanical','CSE','IT'], interests:['text','data'], bestFor:'beginner', intro:'Group supplied fictional maintenance notes by simple keywords.', input:'A small sample of fictional machine notes.', output:'A filterable list of note themes.', caution:'It cannot predict equipment failure.', steps:['10 min: read sample notes','15 min: choose useful terms','25 min: build a filter','10 min: review misses'], starter:['sample-maintenance.csv','README checklist','tag rules'], next:'Review ambiguous notes with a domain mentor.' },
  { id:'inspection-notes', title:'Inspection note search', branches:['Civil','CSE','IT'], interests:['text','images','data'], bestFor:'intermediate', intro:'Organise synthetic infrastructure notes for easier review.', input:'A supplied set of fictional inspection notes.', output:'Searchable themes with source notes.', caution:'This is not a structural safety assessment.', steps:['10 min: inspect notes','15 min: set categories','25 min: build search','10 min: review edge cases'], starter:['sample-inspection.csv','README checklist','category guide'], next:'Have a civil engineer review the taxonomy.' },
  { id:'image-sorter', title:'Sample image sorter', branches:['CSE','IT','Civil'], interests:['images','data'], bestFor:'intermediate', intro:'Sort a tiny supplied image set using labels or a prepared embedding starter.', input:'A few synthetic sample images.', output:'A gallery grouped by chosen tags.', caution:'The groups are a demo, not a reliable inspection decision.', steps:['10 min: inspect images','15 min: define tags','25 min: wire the gallery','10 min: inspect errors'], starter:['image manifest','README checklist','test tags'], next:'Expand the set and measure incorrect labels.' },
  { id:'community-pulse', title:'Community feedback themes', branches:['CSE','IT','Civil','Mechanical','ECE','EEE'], interests:['community','text','data'], bestFor:'beginner', intro:'Summarise themes from a tiny fictional campus feedback set.', input:'Synthetic feedback sentences.', output:'A theme count with example source sentences.', caution:'A small sample cannot represent a whole campus.', steps:['10 min: read feedback','15 min: pick themes','25 min: count and display','10 min: inspect misses'], starter:['sample-feedback.csv','README checklist','theme list'], next:'Ask reviewers whether the themes are understandable.' },
  { id:'energy-dashboard', title:'Energy-use sample dashboard', branches:['EEE','ECE','CSE','IT'], interests:['sensors','data'], bestFor:'intermediate', intro:'Explore a fictional energy-use time series with a clear unit legend.', input:'A supplied synthetic kWh series.', output:'A chart and simple peak-hour summary.', caution:'No claim about real electrical systems or savings.', steps:['10 min: check units','15 min: plot the series','25 min: mark peak hours','10 min: write caveats'], starter:['sample-energy.csv','README checklist','units guide'], next:'Compare another sample period.' },
  { id:'study-plan', title:'Study topic organiser', branches:['CSE','IT','ECE','EEE','Mechanical','Civil'], interests:['text','community'], bestFor:'beginner', intro:'Turn a supplied topic list into a simple, editable first-week plan.', input:'A small fictional list of topics and available time.', output:'A readable checklist grouped by day.', caution:'It is a planning aid, not a learning outcome guarantee.', steps:['10 min: inspect topics','15 min: set priorities','25 min: build checklist','10 min: edit and export'], starter:['sample-topics.csv','README checklist','one-week outline'], next:'Try the plan with a real volunteer after consent.' },
];

export type PairProject = { title:string; intro:string; roles:[string,string]; milestone:string; caution:string; provisional:boolean };
export function pairProject(a: Answers, b: Answers): PairProject {
  const branches = [a.branch,b.branch];
  const has = (x:Branch,y:Branch) => branches.includes(x) && branches.includes(y);
  if ((branches.includes('CSE') || branches.includes('IT')) && branches.includes('ECE')) return { title:'Sensor anomaly explorer', intro:'Build a tiny interface around supplied fictional sensor readings.', roles:[`${a.branch}: ${a.branch==='ECE'?'interpret signals and baseline':'build interface and connect chart'}`,`${b.branch}: ${b.branch==='ECE'?'interpret signals and baseline':'build interface and connect chart'}`], milestone:'Plot one CSV and explain three flagged readings.', caution:'No safety or diagnosis claim.', provisional:false };
  if ((branches.includes('CSE') || branches.includes('IT')) && branches.includes('Mechanical')) return { title:'Maintenance log explorer', intro:'Search fictional maintenance notes and group recurring themes.', roles:[`${a.branch}: ${a.branch==='Mechanical'?'define useful note themes':'build search and filters'}`,`${b.branch}: ${b.branch==='Mechanical'?'define useful note themes':'build search and filters'}`], milestone:'Filter a supplied note set by two themes.', caution:'No failure prediction.', provisional:false };
  if ((branches.includes('CSE') || branches.includes('IT')) && branches.includes('Civil')) return { title:'Inspection note explorer', intro:'Organise synthetic inspection notes for a reviewer.', roles:[`${a.branch}: ${a.branch==='Civil'?'define review categories':'build note search interface'}`,`${b.branch}: ${b.branch==='Civil'?'define review categories':'build note search interface'}`], milestone:'Search and group ten fictional notes.', caution:'No structural safety claim.', provisional:false };
  if (has('ECE','EEE')) return { title:'Energy-use sensor dashboard', intro:'Explore a synthetic energy and sensor time series.', roles:[`${a.branch}: ${a.branch==='ECE'?'inspect signal data':'interpret electrical units'}`,`${b.branch}: ${b.branch==='ECE'?'inspect signal data':'interpret electrical units'}`], milestone:'Chart one sample series and label peak readings.', caution:'No real-world efficiency claim.', provisional:false };
  const shared = a.interests.find(x=>b.interests.includes(x)) || 'data';
  return { title:`Shared ${shared} starter`, intro:'Use a supplied synthetic data set to build a small explainer together.', roles:[`${a.branch}: prepare one input and explain it`,`${b.branch}: build one output view and review it`], milestone:'Show one input, one output and one limitation.', caution:'This pairing is provisional and needs mentor review.', provisional:true };
}

export function validAnswers(value: unknown): value is Answers {
  if (!value || typeof value !== 'object') return false;
  const a=value as Partial<Answers>;
  const validIdea=a.idea===undefined || (typeof a.idea==='string' && a.idea.length<=240 && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(a.idea));
  const validChallenge=a.challenge===undefined || (typeof a.challenge==='string' && !!a.branch && (a.challenge==='own' || CHALLENGES[a.branch]?.some(c=>c.id===a.challenge)));
  const validStyle=a.buildStyle===undefined || BUILD_STYLES.some(s=>s.id===a.buildStyle);
  const ownIdeaReady=a.challenge!=='own' || (typeof a.idea==='string' && a.idea.trim().length>=6);
  return BRANCHES.includes(a.branch as Branch) && ['beginner','intermediate'].includes(a.level || '') && Array.isArray(a.interests) && a.interests.length <= 2 && a.interests.every(i=>INTERESTS.includes(i)) && ['interview','useful','curious'].includes(a.outcome || '') && validIdea && validChallenge && validStyle && ownIdeaReady;
}
export function recommend(a: Answers) {
  return [...PROJECTS].sort((x,y)=> {
    const score=(p:Project)=> (p.branches.includes(a.branch)?10:0)+a.interests.filter(i=>p.interests.includes(i)).length*4+(p.bestFor===a.level?4:0)+(p.branches.length<=3?2:0)+(a.outcome==='useful' && p.interests.includes('community')?1:0);
    return score(y)-score(x) || x.id.localeCompare(y.id);
  }).slice(0,3);
}
