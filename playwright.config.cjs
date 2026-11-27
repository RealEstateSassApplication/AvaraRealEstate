const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests/browser',timeout:90000,expect:{timeout:15000},workers:2,retries:0,use:{baseURL:'http://127.0.0.1:3000',browserName:'chromium',trace:'retain-on-failure'},webServer:{command:'npm run start -- --hostname 127.0.0.1',url:'http://127.0.0.1:3000/tools',timeout:120000,reuseExistingServer:false}});
