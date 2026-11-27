const {test,expect}=require('@playwright/test');
const fixture={_id:'507f1f77bcf86cd799439011',title:'Test apartment — browser fixture',description:'Test only',type:'apartment',purpose:'rent',price:65000,currency:'LKR',rentFrequency:'monthly',bedrooms:2,bathrooms:1,areaSqft:850,images:['/images/property-placeholder.jpg','/images/property-placeholder.jpg'],address:{city:'Nugegoda',district:'Colombo'},amenities:['Parking'],ratings:{average:0,count:0},featured:false,verified:false,owner:{name:'Test owner',verified:false}};
async function mock(page,{auth=false,empty=false,error=false}={}){
 let ids=[];
 await page.route('**/api/auth/me',route=>route.fulfill({status:auth?200:401,json:auth?{data:{_id:'test',name:'Test',email:'test@example.invalid',role:'user'}}:{error:'Unauthorized'}}));
 await page.route('**/api/favorites',route=>route.fulfill({status:auth?200:401,json:auth?{ids}:{error:'Unauthorized'}}));
 await page.route('**/api/properties/*/favorite',async route=>{const body=route.request().postDataJSON();ids=body.favorite?[fixture._id]:[];await route.fulfill({status:200,json:{favorite:body.favorite}});});
 await page.route(/\/api\/properties\?/,route=>{const p=new URL(route.request().url()).searchParams;return route.fulfill({status:error?503:200,json:error?{error:'Unavailable'}:{properties:empty?[]:[fixture],total:empty?0:40,totalPages:empty?1:2,page:Number(p.get('page')||1)}});});
 await page.route(/\/api\/blog\?/,route=>route.fulfill({status:200,json:{posts:[],pagination:{total:0,page:1,pages:0,limit:9}}}));
}
async function noOverflow(page){await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);}
for(const width of [360,390,768,1440]){
 test('public routes have no horizontal overflow at '+width,async({page})=>{
  await page.setViewportSize({width,height:850});await mock(page);
  for(const path of ['/','/explore','/explore/nugegoda','/listings?purpose=rent','/tools','/tools/mortgage','/tools/rent-vs-buy','/tools/land-converter','/tools/living-cost','/blog']){
   const response=await page.goto(path);expect(response.status(),path).toBe(200);
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
 await dialog.getByLabel('Apartment',{exact:true}).check();
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
