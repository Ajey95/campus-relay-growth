import { test, expect } from '@playwright/test';

test('two isolated browser contexts register a cross-branch pair and update the shared desk',async({browser,request})=>{
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  expect(created.status()).toBe(201);
  const {workspaceId,studentUrl,operatorUrl}=await created.json();
  const first=await browser.newContext(),second=await browser.newContext();
  try {
    const a=await first.newPage();await a.goto(studentUrl);
    await a.getByLabel('Text').check();
    await expect(a.getByRole('button',{name:/Explore curated projects/})).toBeEnabled();
    await a.getByRole('button',{name:/Explore curated projects/}).click();
    await expect(a.getByRole('heading',{name:'Campus FAQ finder'})).toBeVisible();
    await a.getByRole('button',{name:/Continue to demo registration/}).click();
    await a.getByLabel('Fictional email at example.com').fill('playwright-a@example.com');
    await a.getByLabel(/I understand this is a simulation/).check();
    await a.getByRole('button',{name:/Create demo receipt/}).click();
    await expect(a.getByRole('heading',{name:'Demo receipt created'})).toBeVisible();
    await a.getByRole('button',{name:/Invite a friend to build together/}).click();
    const inviteUrl=await a.getByLabel('Copy this friend link').inputValue();
    const b=await second.newPage();await b.goto(inviteUrl);
    await expect(b.getByRole('button',{name:/Explore curated projects/})).toBeEnabled();
    await b.getByLabel('Engineering branch').selectOption('ECE');
    await b.getByRole('button',{name:/Explore curated projects/}).click();
    await expect(b.getByRole('heading',{name:'Build together: Sensor anomaly explorer'})).toBeVisible();
    await expect(b.getByText(/ECE: interpret signals and baseline/)).toBeVisible();
    await b.getByRole('button',{name:/Continue to demo registration/}).click();
    await b.getByLabel('Fictional email at example.com').fill('playwright-b@example.com');
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

test('a typed idea produces three live AI project suggestions',async({browser,request})=>{
  test.skip(!process.env.TEST_AI_LIVE,'Requires a deployed OPENAI_API_KEY and makes one paid API call.');
  const created=await request.post('/api/demo-workspaces',{data:{seedMode:false}});
  expect(created.status()).toBe(201);
  const {studentUrl}=await created.json();
  const page=await browser.newPage();
  await page.goto(studentUrl);
  await page.getByLabel('Engineering branch').selectOption('Mechanical');
  await page.getByLabel('Your own project idea').fill('I want to reduce water waste in a student hostel using sample meter readings.');
  await page.getByRole('button',{name:/Generate project ideas/}).click();
  await expect(page.getByRole('heading',{name:'Ideas shaped from your words'})).toBeVisible({timeout:30000});
  await expect(page.locator('.suggestion')).toHaveCount(3);
  await expect(page.locator('.suggestion-list')).toContainText(/water|meter|hostel/i);
  await page.locator('.suggestion').nth(1).click();
  await expect(page.locator('.suggestion').nth(1)).toHaveAttribute('aria-pressed','true');
  await page.close();
});
