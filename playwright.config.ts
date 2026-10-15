import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:'http://localhost:3000',launchOptions:{executablePath:process.env.CHROMIUM_PATH||undefined}},webServer:{command:'npm run dev',url:'http://localhost:3000',reuseExistingServer:true},reporter:'list'});
