import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir:'./tests',timeout:90000,expect:{timeout:15000},workers:1,
  use:{baseURL:process.env.TEST_BASE_URL||'http://localhost:3100',browserName:'chromium',channel:'chrome',headless:true,trace:'on-first-retry'},
  webServer:process.env.TEST_BASE_URL?undefined:{command:`"${process.execPath}" node_modules/next/dist/bin/next dev -p 3100`,url:'http://localhost:3100',reuseExistingServer:!process.env.CI,timeout:120000}
});
