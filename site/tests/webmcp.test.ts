import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyticsReadTool,createToolCatalog,createPVTools,registerTools,type PVToolHost,type WebTool} from '../lib/webmcp.ts';
import type {Build,Product} from '../lib/types.ts';
function fixture(){
 let build:Build={name:'Test roof',lines:[],settings:{purpose:'hybrid',mount:'roof'}},compare:string[]=[],watchIds:string[]=[];
 let ready=true,requests:string[]=[],navigated='';
 const products=[{id:'panel',name:'Solar Panel 400W',brand:'Example',category:'panels',specs:{watts:400},offers:[{id:'pack',price:300,packQuantity:3,currency:'USD',stock:'in_stock',observedAt:new Date().toISOString()}]}] as unknown as Product[];
 const host:PVToolHost={state:()=>({path:'/',build,compare,watchIds,draftReady:ready,watchReady:true,authenticated:false,catalogReady:false}),catalog:async()=>products,request:async(path)=>{requests.push(path);return path.startsWith('products/')?{product:products[0]}:{observations:[],offers:products[0].offers};},updateBuild:fn=>(build=fn(build)),setCompare:ids=>{compare=ids;},setWatch:async(id,watched)=>{watchIds=watched?[...watchIds,id]:watchIds.filter(x=>x!==id);},navigate:href=>{navigated=href;}};
 const tools=createPVTools(host),call=(name:string,input:unknown={})=>tools.find(t=>t.name==='pvpartpicker_'+name)!.execute(input,{});
 return {call,host,tools,products,requests,get build(){return build;},set ready(v:boolean){ready=v;},get navigated(){return navigated;}};
}
test('WebMCP starts on lightweight pages and searches brands with bounded pagination',async()=>{
 const f=fixture();const status:any=await f.call('get_workspace');assert.equal(status.path,'/');assert.equal(status.catalogReady,false);
 const result:any=await f.call('search_parts',{query:'Example',category:'panels',limit:1});assert.equal(result.items[0].id,'panel');assert.equal(result.total,1);
 await assert.rejects(()=>f.call('search_parts',{category:'wrong'}));await assert.rejects(()=>f.call('search_parts',{limit:101}));await assert.rejects(()=>f.call('search_parts',{unused:true}));
});
test('quantity edits validate limits, preserve settings, and report actual pack-aware costs',async()=>{
 const f=fixture();const result:any=await f.call('set_build_quantity',{productId:'panel',quantity:4,offerId:'pack'});assert.equal(result.quantity,4);assert.equal(result.purchaseCost,600);assert.equal(result.purchasedUnits,6);
 await assert.rejects(()=>f.call('set_build_quantity',{productId:'missing',quantity:1}));await assert.rejects(()=>f.call('set_build_quantity',{productId:'panel',quantity:1,offerId:'missing'}));
 f.ready=false;await assert.rejects(()=>f.call('set_build_quantity',{productId:'panel',quantity:2}),/draft/i);f.ready=true;
 await f.call('update_build',{name:'Cabin',purpose:'offgrid'});assert.equal(f.build.name,'Cabin');assert.equal(f.build.settings.mount,'roof');
 await f.call('set_build_quantity',{productId:'panel',quantity:0});assert.equal(f.build.lines.length,0);
});
test('build size limits fail honestly and private analytics are omitted by default',async()=>{
 const f=fixture();f.host.updateBuild(b=>({...b,lines:Array.from({length:100},(_,i)=>({productId:'old'+i,quantity:1})),settings:{...b.settings,analytics:{location:{label:'Private home',latitude:42,longitude:-78}} as any}}));
 await assert.rejects(()=>f.call('set_build_quantity',{productId:'panel',quantity:1}),/100/);
 const result:any=await f.call('read_build');assert.equal(result.build.settings.analytics,undefined);assert.equal(result.privateAnalyticsOmitted,true);
 const privateResult:any=await f.call('read_build',{includePrivateAnalytics:true});assert.equal(privateResult.build.settings.analytics.location.label,'Private home');
});
test('navigation is allowlisted and opens analytics without auth/admin or external URLs',async()=>{
 const f=fixture();await f.call('open_page',{section:'build',tab:'analytics'});assert.equal(f.navigated,'/build?tab=analytics');
 await f.call('open_page',{section:'parts',category:'panels',query:'small panel',builder:true});assert.equal(f.navigated,'/parts?category=panels&q=small+panel&builder=1');
 await assert.rejects(()=>f.call('open_page',{section:'https://evil.example'}));await assert.rejects(()=>f.call('open_page',{section:'admin'}));
 await assert.rejects(()=>f.call('open_page',{section:'product',productId:'../admin'}));
});
test('watch operations are idempotent and compare validates its four-product limit',async()=>{
 const f=fixture();await f.call('set_watch',{productId:'panel',watched:true});await f.call('set_watch',{productId:'panel',watched:true});assert.deepEqual((await f.call('read_watchlist') as any).productIds,['panel']);
 await f.call('set_comparison',{productIds:['panel','panel']});assert.deepEqual((await f.call('read_comparison') as any).productIds,['panel']);
 await assert.rejects(()=>f.call('set_comparison',{productIds:Array(5).fill('panel')}));
 await f.call('set_watch',{productId:'panel',watched:false});assert.deepEqual((await f.call('read_watchlist') as any).productIds,[]);
});
test('detail and history tools use known product IDs and preserve history gaps',async()=>{
 const f=fixture();const detail:any=await f.call('get_product',{productId:'panel'});assert.equal(detail.product.id,'panel');
 const history:any=await f.call('get_price_history',{productId:'panel',days:30});assert.deepEqual(history.observations,[]);assert.equal(history.days,30);assert.match(history.notice,/invent/i);
 assert.deepEqual(f.requests,['products/panel','history?productId=panel&days=30']);
 await assert.rejects(()=>f.call('get_price_history',{productId:'panel',days:1}));
});
test('cancellation prevents mutations and cleanup aborts only owned registrations',async()=>{
 const f=fixture(),controller=new AbortController();controller.abort();await assert.rejects(()=>f.tools.find(t=>t.name.endsWith('set_build_quantity'))!.execute({productId:'panel',quantity:1},{signal:controller.signal}));assert.equal(f.build.lines.length,0);
 const signals:AbortSignal[]=[];const cleanup=registerTools(f.tools,{registerTool:async(_t:WebTool,o:any)=>{signals.push(o.signal);}});assert.equal(signals.length,f.tools.length);cleanup();assert.ok(signals.every(s=>s.aborted));
 assert.doesNotThrow(()=>registerTools(f.tools,undefined)());
});
test('analytics reads current displayed status and keeps private assumptions opt-in',async()=>{
 let status='loading';const tool=analyticsReadTool(()=>({status,settings:{location:{label:'Private'}},report:null}));
 assert.equal((await tool.execute({}, {}) as any).settings,undefined);status='invalid';assert.equal((await tool.execute({}, {}) as any).status,'invalid');
 assert.equal((await tool.execute({includePrivateAssumptions:true}, {}) as any).settings.location.label,'Private');
});
test('calculator inputs and drop filters reject invalid values before network requests',async()=>{
 const f=fixture();await assert.rejects(()=>f.call('get_price_drops',{minPercent:101}));await assert.rejects(()=>f.call('get_price_drops',{sort:'wrong'}));assert.equal(f.requests.length,0);
 const result:any=await f.call('calculate',{calculator:'battery'});assert.ok(result.stats.length>0);
 await assert.rejects(()=>f.call('calculate',{calculator:'battery',values:{unknown:2}}));await assert.rejects(()=>f.call('calculate',{calculator:'battery',values:{capacityKwh:NaN}}));
});
test('agent edits retain saved identity and existing private/connection settings',async()=>{
 const f=fixture();f.host.updateBuild(b=>({...b,id:'device:existing',shareId:'shared-existing',settings:{...b.settings,pvArrays:[]}}));
 await f.call('set_build_quantity',{productId:'panel',quantity:1});assert.equal(f.build.id,'device:existing');assert.equal(f.build.shareId,'shared-existing');
 await f.call('update_build',{name:'Renamed'});assert.equal(f.build.id,'device:existing');assert.deepEqual(f.build.settings.pvArrays,[]);
});
test('fresh catalog reads reuse identity; expired concurrent reads load/adopt once',async()=>{
 const f=fixture();let current={products:f.products,reports:[],expiresAt:1000},loads=0,adopts=0,now=500;
 const load=createToolCatalog(()=>current,async()=>{loads++;return {...current,expiresAt:2000};},data=>{adopts++;current=data as typeof current;},()=>now);
 assert.equal(await load(),f.products);assert.equal(loads,0);now=1001;await Promise.all([load(),load()]);assert.equal(loads,1);assert.equal(adopts,1);await load();assert.equal(loads,1);
});
test('default analytics output does not leak load, bill, payback or annual household use',async()=>{
 const t=analyticsReadTool(()=>({report:{annualKwh:10000,annualSavings:1900,simplePayback:9,months:[{month:'Jan',generationKwh:300,loadKwh:833,gridKwh:533,savings:57}]},settings:{annualUsageKwh:10000}}));
 const r:any=await t.execute({},{});assert.deepEqual(r.report,{annualKwh:10000,months:[{month:'Jan',generationKwh:300}]});assert.equal(r.settings,undefined);
});
