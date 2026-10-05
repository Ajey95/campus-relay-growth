import { test, expect } from '@playwright/test';

test('home has separate student and seeded admin demo entries',async({browser})=>{
  const student=await browser.newContext(),admin=await browser.newContext();
  try {
    const a=await student.newPage();await a.goto('/');
    await expect(a.getByRole('button',{name:/Try student registration/})).toBeVisible();
    await expect(a.getByRole('button',{name:/Explore admin Growth desk/})).toBeVisible();
    await a.getByRole('button',{name:/Try student registration/}).click();
    await expect(a).toHaveURL(/\/w\/[a-f0-9]+/);
    await expect(a.getByRole('heading',{name:'Let’s find your project'})).toBeVisible();
    const studentWorkspaceId=new URL(a.url()).pathname.split('/').pop();
    await a.goto('/');
    await a.getByRole('button',{name:/Explore admin Growth desk/}).click();
    await expect(a).toHaveURL(new RegExp(`/desk/${studentWorkspaceId}`));
    await expect(a.getByRole('heading',{name:'Channel performance'})).toBeVisible();
    const b=await admin.newPage();await b.goto('/');
    await b.getByRole('button',{name:/Explore admin Growth desk/}).click();
    await expect(b).toHaveURL(/\/desk\/[a-f0-9]+/);
    await expect(b.getByRole('heading',{name:'Channel performance'})).toBeVisible();
    await expect(b.getByText('SIMULATED DATA / NO CAMPAIGN EXECUTED')).toBeVisible();
    await expect(b.locator('.metrics > div').first()).toContainText('5');
  } finally {await student.close();await admin.close()}
});

test('two isolated browser contexts register a cross-branch pair and update the shared desk',async({browser,request})=>{
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  expect(created.status()).toBe(201);
  const {workspaceId,studentUrl,operatorUrl}=await created.json();
  const first=await browser.newContext(),second=await browser.newContext();
  try {
    const a=await first.newPage();await a.goto(studentUrl);
    await expect(a.getByRole('button',{name:'Browse curated examples'})).toBeEnabled();
    await a.getByRole('button',{name:'Browse curated examples'}).click();
    await expect(a.getByRole('heading',{name:'Campus FAQ finder'})).toBeVisible();
    await expect(a.getByRole('region',{name:'How this project works'}).locator('.project-flow li')).toHaveCount(3);
    await expect(a.locator('.project-use')).toContainText('fictional campus directory');
    await expect(a.locator('.project-precedent a')).toHaveAttribute('href','https://edu.google.com/resources/customer-stories/strategic-education-virtual-assistant/');
    await a.locator('.suggestion').nth(1).click();
    await expect(a.locator('.project-precedent a')).toHaveAttribute('href','https://www.faa.gov/av-info/download_SDR');
    await expect(a.locator('.project-use')).toContainText('fictional notes');
    await a.getByRole('button',{name:/Continue to demo registration/}).click();
    await a.getByLabel('Fictional email at example.com').fill('playwright-a@example.com');
    await a.getByRole('button',{name:'Continue →'}).click();
    await a.getByRole('button',{name:'2027'}).click();
    await a.getByLabel(/I understand this is a simulation/).check();
    await a.getByRole('button',{name:/Create demo receipt/}).click();
    await expect(a.getByRole('heading',{name:'Demo receipt created'})).toBeVisible();
    await a.getByRole('button',{name:/Invite a friend to build together/}).click();
    const inviteUrl=await a.getByLabel('Copy this friend link').inputValue();
    const b=await second.newPage();await b.goto(inviteUrl);
    await b.getByTestId('reply-ECE').click();
    await b.getByRole('button',{name:'Browse curated examples'}).click();
    await expect(b.getByRole('heading',{name:'Build together: Sensor anomaly explorer'})).toBeVisible();
    await expect(b.getByText(/ECE: interpret signals and baseline/)).toBeVisible();
    await b.getByRole('button',{name:/Continue to demo registration/}).click();
    await b.getByLabel('Fictional email at example.com').fill('playwright-b@example.com');
    await b.getByRole('button',{name:'Continue →'}).click();
    await b.getByRole('button',{name:'2027'}).click();
    await b.getByLabel(/I understand this is a simulation/).check();
    await b.getByRole('button',{name:/Create demo receipt/}).click();
    await expect(b.getByRole('heading',{name:'Demo receipt created'})).toBeVisible();
    const dashboard=await request.get(`/api/dashboard?workspaceId=${workspaceId}`,{headers:{'x-operator-token':new URL(operatorUrl).hash.slice('#operator='.length)}});
    expect(dashboard.status()).toBe(200);
    const numbers=await dashboard.json();
    expect(numbers.totals.eligible).toBe(2);
    expect(numbers.referral.valid).toBe(1);
    expect(numbers.channel.reduce((n:number,row:{eligible:number})=>n+row.eligible,0)).toBe(2);
    const desk=await first.newPage();await desk.goto(operatorUrl);
    await expect(desk.locator('.metrics > div').first()).toContainText('2');
  } finally {await first.close();await second.close()}
});

test('server validation, attribution, concurrency and CSV disclosure',async({request})=>{
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  const {workspaceId,operatorUrl}=await created.json();
  const operatorToken=new URL(operatorUrl).hash.slice('#operator='.length);
  const link=await request.post('/api/links',{headers:{'x-operator-token':operatorToken},data:{workspaceId,source:'club',medium:'group',partnerId:'=sample',campusId:'campus-a',creativeVariant:'v1'}});
  expect(link.status()).toBe(201);
  const {linkId}=await link.json();
  const visit=await request.post('/api/visits',{data:{workspaceId,linkId}});
  const {visitorId}=await visit.json();
  const rec=await request.post('/api/recommendations',{data:{workspaceId,visitorId,answers:{branch:'Mechanical',level:'beginner',interests:['data'],outcome:'useful'}}});
  expect((await rec.json()).primary.title).toBe('Maintenance note explorer');
  const invalid=await request.post('/api/registrations',{data:{workspaceId,visitorId,email:'real@gmail.com',graduationYear:2027,branch:'CSE',acknowledge:true}});
  expect(invalid.status()).toBe(422);
  const unsupported=await request.post('/api/registrations',{data:{workspaceId,visitorId,email:'other@example.com',graduationYear:2027,branch:'MBA',acknowledge:true}});
  expect(unsupported.status()).toBe(422);
  const registration={workspaceId,visitorId,email:'same@example.com',graduationYear:2027,branch:'Mechanical',acknowledge:true};
  const responses=await Promise.all([request.post('/api/registrations',{data:registration}),request.post('/api/registrations',{data:registration})]);
  expect(responses.map(r=>r.status()).sort()).toEqual([201,409]);
  const dashboard=await request.get(`/api/dashboard?workspaceId=${workspaceId}`,{headers:{'x-operator-token':operatorToken}});
  const data=await dashboard.json();
  expect(data.totals.eligible).toBe(1);
  expect(data.channel.find((row:{source:string})=>row.source==='club').eligible).toBe(1);
  const csv=await request.get(`/api/export.csv?workspaceId=${workspaceId}`,{headers:{'x-operator-token':operatorToken}});
  const text=await csv.text();
  expect(text).toContain('assessment simulation');
  expect(text).not.toContain('same@example.com');
  expect(text).not.toContain('=sample');
});

test('conversation adapts to branch and keeps the student’s own idea',async({page,request})=>{
  await page.route('**/api/interview',async route=>{
    const turn=route.request().postDataJSON().interview.turn;
    const reply=turn===0?
      {acknowledgement:'Shady routes could make a campus walk easier.',question:'Who would try the shaded-route map first?',mode:'ai'}:
      {acknowledgement:'Students walking at midday give this a clear setting.',question:'What could they see on a small map after one hour?',mode:'ai'};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(reply)});
  });
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  const {studentUrl}=await created.json();
  await page.goto(studentUrl);
  await page.getByTestId('reply-Civil').click();
  await expect(page.getByText('In Civil, what problem keeps catching your eye?')).toBeVisible();
  await expect(page.getByTestId('reply-water-use')).toBeVisible();
  await page.getByTestId('reply-own').click();
  await page.getByLabel('What’s your idea?').fill('I want to map shady walking routes across campus.');
  await page.getByRole('button',{name:'Send →'}).click();
  await expect(page.getByText('Who would try the shaded-route map first?')).toBeVisible();
  await page.getByLabel('Your reply').fill('Students walking between classes at midday.');
  await page.getByRole('button',{name:'Send →'}).click();
  await expect(page.getByText('What could they see on a small map after one hour?')).toBeVisible();
  await page.getByLabel('Your reply').fill('A tiny map comparing two shaded routes using sample points.');
  await page.getByRole('button',{name:'Send →'}).click();
  await page.getByTestId('reply-interactive').click();
  await page.getByTestId('reply-beginner').click();
  await page.getByTestId('reply-curious').click();
  await expect(page.getByText(/I heard your idea, the people or setting/)).toBeVisible();
  await expect(page.getByTestId('interview-mode').filter({hasText:'AI follow-up'})).toHaveCount(2);
  await expect(page.getByRole('button',{name:/Reveal my project paths/})).toBeEnabled();
});

test('a typed idea produces three live AI project suggestions',async({browser,request})=>{
  test.skip(!process.env.TEST_AI_LIVE,'Requires a deployed OPENAI_API_KEY and makes one paid API call.');
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  expect(created.status()).toBe(201);
  const {studentUrl}=await created.json();
  const page=await browser.newPage();
  await page.goto(studentUrl);
  await page.getByTestId('reply-Mechanical').click();
  await page.getByTestId('reply-own').click();
  await page.getByLabel('What’s your idea?').fill('I want to reduce water waste in a student hostel using sample meter readings.');
  await page.getByRole('button',{name:'Send →'}).click();
  await expect(page.getByTestId('interview-mode').filter({hasText:'AI follow-up'})).toHaveCount(1,{timeout:30000});
  await page.getByLabel('Your reply').fill('A hostel caretaker could use synthetic daily meter readings to spot waste.');
  await page.getByRole('button',{name:'Send →'}).click();
  await expect(page.getByTestId('interview-mode').filter({hasText:'AI follow-up'})).toHaveCount(2,{timeout:30000});
  await page.getByLabel('Your reply').fill('Show a small chart with a suspicious spike and a clear caveat.');
  await page.getByRole('button',{name:'Send →'}).click();
  await page.getByTestId('reply-visual').click();
  await page.getByTestId('reply-beginner').click();
  await page.getByTestId('reply-useful').click();
  await expect(page.getByText(/I heard your idea, the people or setting/)).toBeVisible();
  await page.getByRole('button',{name:/Reveal my project paths/}).click();
  await expect(page.getByRole('heading',{name:'Ideas shaped from your words'})).toBeVisible({timeout:30000});
  await expect(page.locator('.suggestion')).toHaveCount(3);
  await expect(page.locator('.suggestion-list')).toContainText(/water|meter|hostel/i);
  await expect(page.locator('.showcase')).toContainText(/first-hour moment/i);
  await page.locator('.suggestion').nth(1).click();
  await expect(page.locator('.suggestion').nth(1)).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('region',{name:'How this project works'}).locator('.project-flow li')).toHaveCount(3);
  await expect(page.locator('.project-use')).not.toBeEmpty();
  await expect(page.locator('.project-precedent a')).toHaveAttribute('href',/^https:\/\//);
  await page.close();
});
