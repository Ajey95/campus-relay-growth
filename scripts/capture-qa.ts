import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const root=process.env.TEST_BASE_URL||'http://localhost:3100';
  const dir=path.resolve('..','..','work','visual-qa');
  await mkdir(dir,{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const desktop=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    const page=await desktop.newPage();
    await page.goto(root);
    await page.screenshot({path:path.join(dir,'home-desktop.png')});
    await page.getByRole('button',{name:'Create a seeded workspace'}).click();
    await page.getByRole('button',{name:'Find my project'}).waitFor({state:'visible'});
    await expect(page.getByRole('button',{name:'Find my project'})).toBeEnabled();
    await page.screenshot({path:path.join(dir,'student-desktop.png')});
    const studentUrl=page.url();
    await page.getByRole('link',{name:/Growth desk/}).click();
    await page.getByText('Channel performance').waitFor();
    await page.screenshot({path:path.join(dir,'desk-desktop.png')});
    const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
    const phone=await mobile.newPage();await phone.goto(studentUrl);
    await expect(phone.getByRole('button',{name:'Find my project'})).toBeEnabled();
    await phone.screenshot({path:path.join(dir,'student-mobile.png')});
    const overflow=await phone.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
    const deskOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
    console.log(JSON.stringify({screenshots:['home-desktop.png','student-desktop.png','desk-desktop.png','student-mobile.png'],mobileOverflow:overflow,deskOverflow}));
    await desktop.close();await mobile.close();
  } finally {await browser.close()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
