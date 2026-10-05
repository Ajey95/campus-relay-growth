import type { Branch, Interest } from '@/lib/catalog';

export type Challenge={id:string;title:string;detail:string;interest:Interest};

export const BRANCH_HINTS:Record<Branch,string>={
  CSE:'software and useful systems',
  IT:'connected services and information',
  ECE:'signals and everyday devices',
  EEE:'energy and electrical systems',
  Mechanical:'machines and practical operations',
  Civil:'places and physical infrastructure',
};

export const CHALLENGES:Record<Branch,Challenge[]>={
  CSE:[
    {id:'campus-questions',title:'Make campus answers easier to find',detail:'Turn scattered information into a small useful tool.',interest:'text'},
    {id:'learning-patterns',title:'Spot patterns in how students learn',detail:'Explore a tiny fictional study data set.',interest:'data'},
    {id:'community-voices',title:'Understand what students care about',detail:'Find themes in fictional feedback.',interest:'community'},
  ],
  IT:[
    {id:'service-requests',title:'Make service requests clearer',detail:'Sort fictional requests into useful themes.',interest:'text'},
    {id:'workflow-patterns',title:'See where a process slows down',detail:'Explore a small synthetic workflow log.',interest:'data'},
    {id:'campus-information',title:'Help people find the right information',detail:'Build a searchable campus information starter.',interest:'text'},
  ],
  ECE:[
    {id:'sensor-signals',title:'Make sense of sensor readings',detail:'Find an interesting pattern in synthetic signals.',interest:'sensors'},
    {id:'assistive-device',title:'Prototype a helpful device idea',detail:'Simulate its input and output before hardware.',interest:'community'},
    {id:'everyday-energy',title:'Understand everyday energy use',detail:'Explore sample readings with clear units.',interest:'data'},
  ],
  EEE:[
    {id:'energy-patterns',title:'Find a story in energy data',detail:'Chart a fictional kWh series and explain peaks.',interest:'data'},
    {id:'motor-signals',title:'Explore machine signal changes',detail:'Use synthetic readings, not real diagnostics.',interest:'sensors'},
    {id:'campus-power',title:'Make campus power use understandable',detail:'Build a small explanatory dashboard.',interest:'community'},
  ],
  Mechanical:[
    {id:'maintenance-clues',title:'Make maintenance notes useful',detail:'Group fictional machine notes into themes.',interest:'text'},
    {id:'water-operations',title:'Reduce waste in a water process',detail:'Explore synthetic meter or pump readings.',interest:'data'},
    {id:'workshop-flow',title:'Improve a workshop workflow',detail:'Find bottlenecks in a fictional process log.',interest:'data'},
  ],
  Civil:[
    {id:'water-use',title:'Understand water use in a building',detail:'Explore synthetic meter readings and patterns.',interest:'data'},
    {id:'accessible-spaces',title:'Make shared spaces easier to use',detail:'Organise fictional accessibility observations.',interest:'community'},
    {id:'inspection-notes',title:'Find themes in inspection notes',detail:'Search synthetic notes without safety claims.',interest:'text'},
  ],
};

export const BUILD_STYLES=[
  {id:'visual',title:'Show me the pattern',detail:'A chart or visual story that makes something click.'},
  {id:'tool',title:'Make something useful',detail:'A small search, filter or decision-support tool.'},
  {id:'interactive',title:'Let someone try it',detail:'A simple interactive prototype with a visible result.'},
] as const;
export type BuildStyle=typeof BUILD_STYLES[number]['id'];
