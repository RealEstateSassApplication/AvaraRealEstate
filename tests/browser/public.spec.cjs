const {test,expect}=require('@playwright/test');
const fixture={_id:'507f1f77bcf86cd799439011',title:'Test apartment — browser fixture',description:'Test only',type:'apartment',purpose:'rent',price:65000,currency:'LKR',rentFrequency:'monthly',bedrooms:2,bathrooms:1,areaSqft:850,images:['/images/property-placeholder.jpg','/images/property-placeholder.jpg'],address:{city:'Nugegoda',district:'Colombo'},amenities:['Parking'],ratings:{average:0,count:0},featured:false,verified:false,owner:{name:'Test owner',verified:false}};
async function mock(page,{auth=false,empty=false,error=false}={}){
 let ids=[];
 // Public layout tests should not depend on third-party image latency.
 await page.route('https://images.pexels.com/**',route=>route.abort());
 await page.route('**/api/auth/me',route=>route.fulfill({status:auth?200:401,json:auth?{data:{_id:'test',name:'Test',email:'test@example.invalid',role:'user'}}:{error:'Unauthorized'}}));
 await page.route('**/api/favorites',route=>route.fulfill({status:auth?200:401,json:auth?{ids}:{error:'Unauthorized'}}));
 await page.route('**/api/properties/*/favorite',async route=>{const body=route.request().postDataJSON();ids=body.favorite?[fixture._id]:[];await route.fulfill({status:200,json:{favorite:body.favorite}});});
 await page.route(/\/api\/properties\?/,route=>{const p=new URL(route.request().url()).searchParams;return route.fulfill({status:error?503:200,json:error?{error:'Unavailable'}:{properties:empty?[]:[fixture],total:empty?0:40,totalPages:empty?1:2,page:Number(p.get('page')||1)}});});
 await page.route(url=>url.pathname==='/api/blog',route=>route.fulfill({status:200,json:{posts:[],pagination:{total:0,page:1,pages:0,limit:9}}}));
}
async function noOverflow(page){await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}
for(const width of [320,360,390,768,1440]){
 test('public routes have no horizontal overflow at '+width,async({page})=>{
  await page.setViewportSize({width,height:850});await mock(page);
  for(const path of ['/','/explore','/explore/nugegoda','/listings?purpose=rent','/tools','/tools/mortgage','/tools/rent-vs-buy','/tools/land-converter','/tools/living-cost','/blog','/rentals','/request-property','/rentals/my-requests','/rentals/opportunities','/discover','/map','/compare','/new-properties','/developments','/market','/concierge','/guides','/guides/buying-land-sri-lanka','/guides/perch-acre-square-feet','/about']){
   const response=await page.goto(path,{waitUntil:'domcontentloaded'});expect(response.status(),path).toBe(200);
   await expect(page.getByRole('heading',{level:1}).first()).toBeVisible();
   await noOverflow(page);
  }
 });
}
test('mobile menu and search filters retain editable values and URL state',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mock(page);
 await page.goto('/');
 await page.getByRole('button',{name:'Toggle menu'}).click();
 await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();
 await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Rent',exact:true}).click();
 await expect(page).toHaveURL(/purpose=rent/);
 await page.getByRole('textbox',{name:'Location'}).fill('Nugegoda');
 await page.getByRole('button',{name:/^Filters/}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await dialog.getByLabel('Maximum',{exact:true}).fill('65000');
 await dialog.getByLabel('apartment',{exact:true}).check();
 await dialog.getByRole('button',{name:'Apply filters'}).click();
 await expect(page).toHaveURL(/maxPrice=65000/);await expect(page).toHaveURL(/city=Nugegoda/);await expect(page).toHaveURL(/type=apartment/);
 await expect(page.getByText('40 properties found')).toBeVisible();
 await page.getByRole('button',{name:'Next',exact:true}).click();
 await expect(page).toHaveURL(/page=2/);await expect(page.getByText('Page 2 of 2')).toBeVisible();
 await page.reload();await expect(page.getByText('Page 2 of 2')).toBeVisible();
 await page.goBack();await expect(page).not.toHaveURL(/page=2/);await noOverflow(page);
});
test('saved state and photo controls on listings',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mock(page,{auth:true});
 await page.goto('/listings');
 await expect(page.getByRole('button',{name:'Add to favorites'})).toBeVisible();
 await page.getByRole('button',{name:'Add to favorites'}).click();
 await expect(page.getByRole('button',{name:'Remove from favorites'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Next property photo'}).click();
 await page.getByRole('button',{name:'Remove from favorites'}).click();
 await expect(page.getByRole('button',{name:'Add to favorites'})).toBeVisible();
});
test('empty and failed listing results are distinct',async({page})=>{
 await mock(page,{empty:true});await page.goto('/listings');
 await expect(page.getByRole('heading',{name:'No matching properties'})).toBeVisible();
 await page.unroute(/\/api\/properties\?/);
 await page.route(/\/api\/properties\?/,route=>route.fulfill({status:503,json:{error:'Unavailable'}}));
 await page.reload();await expect(page.getByRole('heading',{name:'Listings are temporarily unavailable.'})).toBeVisible();
});

test('not-found recovery and safe login return',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mock(page);
 const response=await page.goto('/this-page-does-not-exist');
 expect(response.status()).toBe(404);
 await expect(page.getByRole('heading',{name:'This place is off the map.'})).toBeVisible();
 await noOverflow(page);
 await page.route('**/api/auth/login',route=>route.fulfill({status:200,json:{data:{role:'user'}}}));
 await page.goto('/auth/login?next=%2Flistings%3Fpurpose%3Drent');
 await page.locator('input[name="email"]').fill('test@example.invalid');
 await page.locator('input[name="password"]').fill('TestPassword123!');
 await page.locator('button[type="submit"]').click();
 await expect(page).toHaveURL(/\/listings\?purpose=rent/);
 await page.goto('/auth/login?next=https%3A%2F%2Fexample.invalid');
 await page.locator('input[name="email"]').fill('test@example.invalid');
 await page.locator('input[name="password"]').fill('TestPassword123!');
 await page.locator('button[type="submit"]').click();
 await expect(page).toHaveURL(/\/auth\/login\?next=%2Fworkspace|\/workspace/);
});

test('knowledge pages expose crawlable answers and canonical metadata',async({request})=>{
 const response=await request.get('/guides/buying-land-sri-lanka');expect(response.status()).toBe(200);
 const html=await response.text();expect(html).toContain('What should I check before buying land in Sri Lanka?');expect(html).toContain('online.land.rgd.gov.lk');expect(html).toContain('rel="canonical"');expect(html).toContain('application/ld+json');
 const sitemap=await (await request.get('/sitemap.xml')).text();expect(sitemap).toContain('/guides/buying-land-sri-lanka');expect(sitemap).toContain('/about');expect(sitemap).not.toContain('/admin/');
 const robots=await (await request.get('/robots.txt')).text();expect(robots).toContain('OAI-SearchBot');expect(robots).toContain('Disallow: /admin');
 const image=await request.get('/opengraph-image');expect(image.status()).toBe(200);expect(image.headers()['content-type']).toContain('image/png');
});

test('renter submits a room request and reviews offers on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await mock(page,{auth:true});
 const row={_id:'507f1f77bcf86cd799439012',propertyTypes:['room'],location:{cities:['Nugegoda'],districts:[],flexible:false},budget:{min:0,max:30000,currency:'LKR',frequency:'monthly'},status:'active',shareWithOwners:true,matchedProperties:[],offers:[{property:fixture,createdAt:'2026-11-27'}]};
 await page.route('**/api/rental-requests',async route=>{if(route.request().method()==='POST'){const body=route.request().postDataJSON();expect(body.propertyTypes).toEqual(['room']);expect(body.budget.max).toBe(30000);expect(body.shareWithOwners).toBe(true);return route.fulfill({status:201,json:{data:{_id:row._id}}});}return route.fulfill({status:200,json:{data:[row]}});});
 await page.goto('/request-property');await page.getByRole('textbox',{name:'Preferred towns',exact:true}).fill('Nugegoda');await page.getByLabel('Maximum',{exact:true}).fill('30000');await page.getByRole('checkbox',{name:/Allow matching property owners/}).check();await page.getByRole('button',{name:'Create rental request'}).click();await expect(page).toHaveURL(/my-requests/);await expect(page.getByRole('heading',{name:'Looking for room'})).toBeVisible();await expect(page.getByRole('link',{name:/Test apartment/})).toBeVisible();await noOverflow(page);
});
test('owner offers a matching property once',async({page})=>{
 await page.setViewportSize({width:360,height:844});await mock(page,{auth:true});let sent=false;
 await page.route('**/api/host/rental-requests',route=>route.fulfill({status:200,json:{data:[{_id:'507f1f77bcf86cd799439012',propertyTypes:['room'],location:{cities:['Nugegoda'],districts:[],flexible:false},budget:{min:0,max:30000,currency:'LKR',frequency:'monthly'},status:'active',matchingProperties:[{propertyId:fixture._id,propertyTitle:fixture.title,score:100,sent}]}]}}));
 await page.route('**/api/rental-requests/*/offer',route=>{expect(route.request().postDataJSON().propertyId).toBe(fixture._id);sent=true;return route.fulfill({status:201,json:{success:true}});});
 await page.goto('/rentals/opportunities');await page.getByRole('button',{name:'Offer property'}).click();await expect(page.getByRole('button',{name:'Offer sent'})).toBeDisabled();await noOverflow(page);
});

test('comparison shortlist and concierge filters',async({page})=>{await page.setViewportSize({width:390,height:844});await mock(page);const p={id:fixture._id,title:'Fixture apartment',type:'apartment',purpose:'rent',price:30000,currency:'LKR',period:'monthly',city:'Nugegoda',district:'Colombo',amenities:['Parking'],verified:false,coordinates:[79.9,6.86]};await page.route('**/api/discovery/properties?*',route=>route.fulfill({status:200,json:{properties:[p]}}));await page.goto('/compare');await page.getByRole('button',{name:'Add to comparison'}).click();await expect(page.getByRole('heading',{name:'Your shortlist (1/4)'})).toBeVisible();await expect(page.getByRole('table')).toBeVisible();await noOverflow(page);await page.goto('/concierge');await page.getByLabel('What are you looking for?').fill('A room in Nugegoda under LKR 30,000 with parking');await page.getByRole('button',{name:'Find search filters'}).click();await expect(page.getByRole('link',{name:'Review matching listings →'})).toHaveAttribute('href',/maxPrice=30000/);await noOverflow(page);});
test('private inbox mobile reply and block',async({page})=>{await page.setViewportSize({width:360,height:844});await mock(page,{auth:true});const id='a'.repeat(64);let blocked=false;const messages=[{mine:false,text:'The room is available.',sentAt:'2026-11-27T00:00:00Z'}];const row={id,propertyId:fixture._id,propertyTitle:'Fixture room',role:'seeker',blocked:false,blockedByMe:false,updatedAt:'2026-11-27T00:00:00Z',lastMessage:messages[0].text};await page.route('**/api/messages',route=>route.fulfill({status:200,json:{data:[{...row,blocked,blockedByMe:blocked,lastMessage:messages[messages.length-1].text}]}}));await page.route('**/api/messages/'+id,route=>{const method=route.request().method();if(method==='POST'){messages.push({mine:true,text:route.request().postDataJSON().message,sentAt:'2026-11-27T00:01:00Z'});return route.fulfill({status:201,json:{success:true}});}if(method==='PATCH'){blocked=route.request().postDataJSON().blocked;return route.fulfill({status:200,json:{success:true}});}return route.fulfill({status:200,json:{data:{...row,blocked,blockedByMe:blocked,messages}}});});await page.goto('/messages');await page.getByRole('button',{name:/Fixture room/}).click();await expect(page.getByRole('log')).toContainText('The room is available.');await page.getByRole('textbox',{name:'Message',exact:true}).fill('Can I view it tomorrow?');await page.getByRole('button',{name:'Send message'}).click();await expect(page.getByRole('log')).toContainText('Can I view it tomorrow?');await page.getByRole('button',{name:'Block',exact:true}).click();await expect(page.getByText('This conversation is blocked. Messages cannot be sent.')).toBeVisible();await noOverflow(page);await page.getByRole('button',{name:'← Inbox'}).click();await expect(page.getByRole('button',{name:/Fixture room/})).toBeVisible();});

test('protected workspaces require server authentication',async({request})=>{for(const path of ['/workspace','/admin/dashboard','/owner','/user/dashboard','/host/dashboard']){const res=await request.get(path,{maxRedirects:0});expect([302,303,307,308]).toContain(res.status());expect(res.headers().location).toContain('/auth/login');}});
test('password recovery form provides clear status on mobile',async({page})=>{await page.setViewportSize({width:360,height:844});await mock(page);await page.route('**/api/auth/recovery',route=>route.fulfill({status:200,json:{message:'If an account exists, check your email.'}}));await page.goto('/auth/forgot-password');await page.getByRole('textbox',{name:'Email'}).fill('test@example.invalid');await page.getByRole('button',{name:'Send reset email'}).click();await expect(page.getByRole('status')).toContainText('check your email');await noOverflow(page);});
test('agent discoverability documents and safe public API',async({request})=>{const robots=await (await request.get('/robots.txt')).text();expect(robots).toContain('OAI-SearchBot');expect(robots).toContain('Allow: /api/agent/properties');const llms=await request.get('/llms.txt');expect(llms.status()).toBe(200);expect(await llms.text()).toContain('/api/agent/openapi.json');const spec=await (await request.get('/api/agent/openapi.json')).json();expect(spec.paths['/api/agent/properties'].get.operationId).toBe('searchPublicProperties');expect((await request.get('/api/agent/properties?page=101')).status()).toBe(400);const response=await request.get('/properties/rooms-for-rent');expect(response.status()).toBe(200);expect(await response.text()).toContain('Rooms for rent in Sri Lanka');});
test('agent catalog validates budget, currency and rental period',async({request})=>{const spec=await (await request.get('/api/agent/openapi.json')).json();const keys=spec.paths['/api/agent/properties'].get.parameters.map(x=>x.name);for(const k of ['minPrice','maxPrice','currency','period'])expect(keys).toContain(k);for(const q of ['maxPrice=-1','minPrice=500&maxPrice=100','currency=XXX','period=yearly','purpose=sale&period=monthly'])expect((await request.get('/api/agent/properties?'+q)).status()).toBe(400);});

test('cross-origin writes are rejected before authentication or database access',async({request})=>{for(const [path,method] of [['/api/auth/login','POST'],['/api/auth/register','POST'],['/api/auth/logout','POST'],['/api/auth/recovery','POST'],['/api/properties','POST'],['/api/properties/507f1f77bcf86cd799439011','PUT'],['/api/properties/507f1f77bcf86cd799439011','DELETE'],['/api/properties/507f1f77bcf86cd799439011/favorite','PATCH'],['/api/properties/507f1f77bcf86cd799439011/contact','POST']]){const res=await request.fetch(path,{method,headers:{Origin:'https://untrusted.example','Sec-Fetch-Site':'cross-site'},...(method==='DELETE'?{}:{data:{}})});expect(res.status(),path).toBe(403);}});

 test('discovery journal is crawlable and primary navigation includes discovery',async({request})=>{const res=await request.get('/');expect(res.status()).toBe(200);const html=await res.text();expect(html).toContain('/discover');expect(html).toContain('/guides/tropical-home-design');for(const path of ['/guides/tropical-home-design','/guides/home-building-checklist','/guides/property-listing-checklist']){const r=await request.get(path);expect(r.status()).toBe(200);expect(await r.text()).toContain('application/ld+json');}expect(await (await request.get('/sitemap.xml')).text()).toContain('/guides/home-building-checklist');});
