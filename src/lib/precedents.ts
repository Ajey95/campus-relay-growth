// These are editorially checked source links. The model selects an ID; it cannot invent a citation URL.
export const PRECEDENTS={
  faq:{title:'Strayer University’s Irving assistant',organization:'Google for Education',url:'https://edu.google.com/resources/customer-stories/strategic-education-virtual-assistant/',connection:'A university assistant categorizes student questions and looks up answers. A starter can make source lookup visible on a tiny sample FAQ.'},
  sensors:{title:'National Water Dashboard',organization:'U.S. Geological Survey',url:'https://waterdata.usgs.gov/',connection:'Public sensor readings are made explorable through a dashboard. A starter can plot fictional readings and explain a flag.'},
  maintenance:{title:'Service Difficulty Reports',organization:'Federal Aviation Administration',url:'https://www.faa.gov/av-info/download_SDR',connection:'The FAA publishes reports about aircraft malfunctions and maintenance inspections. A starter can group fictional note themes for review without predicting failure.'},
  inspection:{title:'Long-Term Bridge Performance InfoBridge',organization:'Federal Highway Administration',url:'https://infobridge.fhwa.dot.gov/',connection:'Bridge records can be searched and visualized for review. A starter can organize fictional notes without making a safety judgment.'},
  images:{title:'Smithsonian Open Access collections',organization:'Smithsonian Institution',url:'https://www.si.edu/OpenAccess',connection:'A large public collection lets people search and explore labelled images. A starter can build a tiny tagged gallery.'},
  feedback:{title:'NYC311 reporting and open data',organization:'NYC311',url:'https://portal.311.nyc.gov/about-nyc-311/',connection:'Public service requests are grouped by topic, place and time. A starter can group fictional campus feedback by theme.'},
  energy:{title:'Building Energy Data tools',organization:'U.S. Department of Energy',url:'https://www.energy.gov/cmei/buildings/building-energy-data',connection:'Building energy data tools organize and visualize usage. A starter can chart synthetic kWh values and mark peaks.'},
  study:{title:'Individual learning plans',organization:'Institute of Education Sciences',url:'https://ies.ed.gov/learn/blog/individual-learning-plans-students-creating-their-pathways-postsecondary-success',connection:'Learners can document goals and track progress in individual plans. A starter can make a short editable topic checklist.'},
} as const;

export type PrecedentId=keyof typeof PRECEDENTS;
export const PRECEDENT_IDS=Object.keys(PRECEDENTS) as PrecedentId[];

export const CURATED_PRECEDENT:Record<string,PrecedentId>={
  'faq-finder':'faq','sensor-explorer':'sensors','maintenance-notes':'maintenance',
  'inspection-notes':'inspection','image-sorter':'images','community-pulse':'feedback',
  'energy-dashboard':'energy','study-plan':'study',
};
