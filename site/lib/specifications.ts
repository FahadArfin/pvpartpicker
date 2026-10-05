import type {Category,Product,ProductSpecification,SpecificationField} from './types.ts';

export interface SpecificationEvidence {url:string;kind:'datasheet'|'manual'|'manufacturer'|'retailer';model?:string;label?:string;checkedAt?:string;rows:string[][];}
type Definition={key:string;label:string;group:string;match:RegExp;categories?:Category[]};
const panel=['panels'] as Category[],storage=['batteries','all-in-one'] as Category[];
const definitions:Definition[]=[
 {key:'model',label:'Model',group:'Identity',match:/^(?:model(?: number| no\.?| name)?|product model|part number|manufacturer part number|sku)$/},
 {key:'moduleEfficiency',label:'Module efficiency',group:'Module & cells',match:/^(?:module|panel|solar panel) efficiency(?:.*)?$/,categories:panel},
 {key:'cellEfficiency',label:'Cell efficiency',group:'Module & cells',match:/^(?:solar )?cell efficiency(?:.*)?$/,categories:panel},
 {key:'cellType',label:'Cell type',group:'Module & cells',match:/^(?:solar )?cell type|^type of cells$|^cells$/ ,categories:panel},
 {key:'cellConstruction',label:'Cell construction',group:'Module & cells',match:/^cell construction$/,categories:panel},
 {key:'technology',label:'Cell technology',group:'Module & cells',match:/^(?:cell )?technology$/,categories:panel},
 {key:'cellCount',label:'Cell count / arrangement',group:'Module & cells',match:/^(?:number of cells|cell count|cell arrangement|cells quantity)$/ ,categories:panel},
 {key:'junctionIpRating',label:'Junction box ingress protection',group:'Protection & limits',match:/^junction box ip rating$/,categories:panel},
 {key:'connectorIpRating',label:'Connector ingress protection',group:'Cable & connections',match:/^connector ip rating$/,categories:panel},
 {key:'outputCable',label:'Output cable',group:'Cable & connections',match:/^output cables?$/,categories:panel},
 {key:'diodes',label:'Bypass diodes',group:'Protection & limits',match:/^number of bypass diodes$/,categories:panel},
 {key:'face',label:'Panel face',group:'Module & cells',match:/^(?:panel face|module type|bifaciality)$/ ,categories:panel},
 {key:'noctTemperature',label:'Nominal operating cell temperature (NOCT)',group:'Temperature & load ratings',match:/^(?:noct|nominal operating cell temperature)(?:.*)?$/,categories:panel},
 {key:'nmotTemperature',label:'Nominal module operating temperature (NMOT)',group:'Temperature & load ratings',match:/^(?:nmot|nominal module operating temperature)(?:.*)?$/,categories:panel},
 {key:'pmaxTemperatureCoefficient',label:'Pmax temperature coefficient',group:'Temperature & load ratings',match:/^(?:temperature coefficient.*(?:pmax|maximum power)|(?:pmax|maximum power).*temperature coefficient)/,categories:panel},
 {key:'vocTemperatureCoefficient',label:'Voc temperature coefficient',group:'Temperature & load ratings',match:/^(?:temperature coefficient.*(?:voc|open circuit)|(?:voc|open circuit).*temperature coefficient)/,categories:panel},
 {key:'iscTemperatureCoefficient',label:'Isc temperature coefficient',group:'Temperature & load ratings',match:/^(?:temperature coefficient.*(?:isc|short circuit)|(?:isc|short circuit).*temperature coefficient)/,categories:panel},
 {key:'maxSystemVoltage',label:'Maximum system voltage',group:'Protection & limits',match:/^max(?:imum)?(?: system)? voltage(?:.*)?$/,categories:panel},
 {key:'maxSeriesFuse',label:'Maximum series fuse rating',group:'Protection & limits',match:/^(?:max(?:imum)? series fuse|series fuse rating)(?:.*)?$/,categories:panel},
 {key:'snowLoad',label:'Snow / front load',group:'Temperature & load ratings',match:/^(?:snow load|front.*load|static load front)(?:.*)?$/,categories:panel},
 {key:'windLoad',label:'Wind / rear load',group:'Temperature & load ratings',match:/^(?:wind load|rear.*load|static load rear)(?:.*)?$/,categories:panel},
 {key:'systemVoltage',label:'System voltage class',group:'Electrical ratings',match:/^system voltage(?:\s*\(.*\))?$/},
 {key:'voltage',label:'Nominal voltage',group:'Electrical ratings',match:/^(?:nominal(?: system| battery)? voltage|rated voltage)(?:.*)?$/},
 {key:'operatingVoltage',label:'Operating voltage range',group:'Electrical ratings',match:/^(?:operating voltage(?: range)?|voltage range|battery operating range|battery voltage range)(?:.*)?$/},
 {key:'capacityAh',label:'Rated capacity',group:'Capacity & battery',match:/^(?:rated capacity|nominal capacity|battery capacity|capacity|ah capacity)(?:\s*\(?ah\)?)?$/,categories:storage},
 {key:'capacityKwh',label:'Energy capacity',group:'Capacity & battery',match:/^(?:(?:rated |nominal |usable |battery )?energy(?: capacity)?|capacity|battery capacity|kwh capacity)(?:\s*\(?k?wh\)?)?$/,categories:storage},
 {key:'chemistry',label:'Battery chemistry',group:'Capacity & battery',match:/^(?:battery type|battery chemistry|chemistry|cell chemistry|cell type)$/,categories:storage},
 {key:'cycleLife',label:'Cycle life (manufacturer conditions)',group:'Capacity & battery',match:/^(?:cycle life|life cycles|battery life cycles|cycles|cycling life)(?:.*)?$/,categories:storage},
 {key:'depthOfDischarge',label:'Depth of discharge',group:'Capacity & battery',match:/^(?:depth of discharge|dod)(?:.*)?$/,categories:storage},
 {key:'maxDischargeCurrent',label:'Maximum continuous discharge current',group:'Electrical ratings',match:/^(?:max(?:imum)?(?: continuous)? discharge current|continuous discharge current)(?:.*)?$/,categories:['batteries','all-in-one','inverters']},
 {key:'peakDischargeCurrent',label:'Peak discharge current',group:'Electrical ratings',match:/^(?:max(?:imum)? discharge peak current|max(?:imum)? discharge current peak|peak discharge current|pulse discharge current)(?:.*)?$/,categories:storage},
 {key:'maxChargeCurrent',label:'Maximum charge current',group:'Electrical ratings',match:/^(?:max(?:imum)?(?: continuous)? charg(?:e|ing) current)(?:.*)?$/},
 {key:'chargeVoltage',label:'Charging voltage',group:'Electrical ratings',match:/^(?:charging voltage(?: range)?|charge voltage|maximum charge voltage|max charge voltage|recommended charge voltage)(?:.*)?$/},
 {key:'expansion',label:'Expansion / parallel connection',group:'Capacity & battery',match:/^(?:max(?:imum)? connections|max(?:imum)? expansion|expandability|expansion|parallel connection|maximum parallel|scalability)(?:.*)?$/,categories:storage},
 {key:'bmsCurrent',label:'BMS current rating',group:'Electrical ratings',match:/^bms(?: current)?$/,categories:storage},
 {key:'selfHeating',label:'Self-heating power',group:'Protection & environment',match:/^self heating power$/,categories:storage},
 {key:'outputWatts',label:'Rated AC output power',group:'AC output',match:/^(?:rated(?: ac)? output power|nominal ac output power|nominal power output|ac output power|continuous(?: ac)? output power|rated power|rated output|ac output)(?:\s*\(?w\)?)?$/,categories:['inverters','all-in-one']},
 {key:'surgeWatts',label:'Surge output (duration as published)',group:'AC output',match:/^(?:surge(?: power| output| capacity)?|peak(?: ac)? output power|peak power)(?:.*)?$/,categories:['inverters','all-in-one']},
 {key:'acOutput',label:'AC output voltage',group:'AC output',match:/^(?:ac output voltage|output voltage|rated ac voltage|nominal output voltage)(?:.*)?$/,categories:['inverters','all-in-one']},
 {key:'phase',label:'AC phase / wiring',group:'AC output',match:/^(?:phase|phases|phase configuration|output phase|grid type)$/},
 {key:'frequency',label:'AC frequency',group:'AC output',match:/^(?:(?:nominal |rated |ac |output )?frequency|nominal ac frequency)(?:.*)?$/},
 {key:'efficiency',label:'Conversion efficiency',group:'Electrical ratings',match:/^(?:efficiency|max(?:imum)? efficiency|peak efficiency|cec efficiency|conversion efficiency)(?:.*)?$/,categories:['inverters','all-in-one','charging','module-electronics']},
 {key:'maxPvVoltage',label:'Maximum PV input voltage',group:'Solar input',match:/^(?:max(?:imum)?(?: pv| solar| dc)? input voltage|solar input voltage range|pv open circuit voltage|maximum pv open circuit voltage)(?:.*)?$/},
 {key:'mpptVoltageRange',label:'MPPT voltage range',group:'Solar input',match:/^(?:mppt voltage range|mpp voltage range|mpp operating voltage range|operating mppt voltage range|mppt operating voltage|mppt range)(?:.*)?$/},
 {key:'mpptCount',label:'Independent MPPT trackers',group:'Solar input',match:/^(?:number of mppts|number of mpp trackers|mpp trackers|mppt trackers|mppt count|no\.? of mpp trackers)(?:.*)?$/},
 {key:'maxMpptCurrent',label:'Maximum MPPT input current',group:'Solar input',match:/^(?:max(?:imum)?(?: pv| solar| mppt| usable)? input current|input current per mppt|maximum operating input current)(?:.*)?$/},
 {key:'maxPvIsc',label:'Maximum PV short-circuit current',group:'Solar input',match:/^(?:max(?:imum)?(?: pv| input)? short circuit(?: input)? current|short circuit current per mppt)(?:.*)?$/},
 {key:'maxPvWatts',label:'Maximum PV input power',group:'Solar input',match:/^(?:max(?:imum)?(?: pv| solar)? input power|max pv array power|max solar input power|solar panel input|solar charging input|pv input power)(?:.*)?$/},
 {key:'chargeCurrentA',label:'Rated charge current',group:'Electrical ratings',match:/^(?:rated charg(?:e|ing) current|charging current|rated current)$/ ,categories:['charging']},
 {key:'acChargeWatts',label:'AC charging input',group:'Charging & connections',match:/^(?:grid charging input|ac charging input|ac input power|ac charge input|ac charging)(?:.*)?$/,categories:['all-in-one','charging']},
 {key:'chargeTime',label:'Charge time (manufacturer conditions)',group:'Charging & connections',match:/^(?:fast charge time|charging time|charge time)(?:.*)?$/,categories:['all-in-one','charging']},
 {key:'ratedCurrent',label:'Rated current',group:'Electrical ratings',match:/^(?:(?:rated|nominal|maximum|max\.?) (?:operating )?current|current rating|amperage)(?:.*)?$/},
 {key:'ratedVoltage',label:'Voltage rating',group:'Electrical ratings',match:/^(?:voltage rating|rated operating voltage|maximum operating voltage)(?:.*)?$/},
 {key:'poles',label:'Poles',group:'Electrical ratings',match:/^(?:number of poles|poles|pole count)$/},
 {key:'interruptRating',label:'Interrupt / breaking capacity',group:'Electrical ratings',match:/^(?:interrupt(?:ing)? rating|interrupt(?:ing)? capacity|breaking capacity|aic)(?:.*)?$/},
 {key:'gauge',label:'Wire gauge / cross-section',group:'Cable & connections',match:/^(?:wire gauge|gauge|conductor size|cable cross section|wire size)(?:.*)?$/},
 {key:'length',label:'Length',group:'Physical specifications',match:/^(?:length|cable length|wire length)(?:\s*\(.*\))?$/},
 {key:'conductor',label:'Conductor material',group:'Cable & connections',match:/^(?:conductor(?: material)?|wire material)$/},
 {key:'connector',label:'Connector / terminal',group:'Cable & connections',match:/^(?:connector(?: type)?|terminal(?:s)?(?: size| type)?|connection(?: type)?|interface)$/},
 {key:'communications',label:'Communications',group:'Monitoring & control',match:/^(?:communication(?:s| interface| protocol)?|remote monitor|connectivity|communication ports)$/},
 {key:'wifi',label:'Wi-Fi',group:'Monitoring & control',match:/^wi fi$/},
 {key:'bluetooth',label:'Bluetooth',group:'Monitoring & control',match:/^bluetooth$/},
 {key:'accuracy',label:'Measurement accuracy',group:'Monitoring & control',match:/^(?:measurement |power |voltage )?accuracy$/},
 {key:'channels',label:'Measurement channels',group:'Monitoring & control',match:/^(?:channels|number of channels|circuits)$/},
 {key:'dimensions',label:'Dimensions',group:'Physical specifications',match:/^(?:dimensions|dimension|size|enclosure dimensions|product dimensions)(?:.*)?$/},
 {key:'weight',label:'Weight',group:'Physical specifications',match:/^(?:(?:net |unit |product )?weight)(?:.*)?$/},
 {key:'material',label:'Material',group:'Physical specifications',match:/^(?:material|enclosure material|housing material|frame material)$/},
 {key:'glass',label:'Front glass',group:'Physical specifications',match:/^(?:front glass|glass thickness|glass)$/ ,categories:panel},
 {key:'tilt',label:'Tilt range',group:'Mounting & fit',match:/^(?:tilt|tilt angle|adjustable tilt|angle range)(?:.*)?$/},
 {key:'compatibility',label:'Supported equipment / fit',group:'Mounting & fit',match:/^(?:compatibility|compatible with|compatible modules|module compatibility|panel compatibility|battery support)$/},
 {key:'mountType',label:'Mount type',group:'Mounting & fit',match:/^(?:mount type|mounting type|installation type)$/},
 {key:'ipRating',label:'Ingress protection',group:'Protection & environment',match:/^(?:ip rating|ingress protection(?: rating)?|protection (?:rating|class|level)|enclosure rating|waterproof rating)(?:.*)?$/},
 {key:'protections',label:'Protection functions',group:'Protection & environment',match:/^(?:protections|electronic protections|protection functions|safety protections)$/},
 {key:'operatingTemperature',label:'Operating temperature',group:'Protection & environment',match:/^(?:operating temperature(?: range)?|operation temperature|temperature range)(?:.*)?$/},
 {key:'chargeTemperature',label:'Charge temperature',group:'Protection & environment',match:/^(?:charge|charging) temperature(?:.*)?$/},
 {key:'dischargeTemperature',label:'Discharge temperature',group:'Protection & environment',match:/^discharg(?:e|ing) temperature(?:.*)?$/},
 {key:'storageTemperature',label:'Storage temperature',group:'Protection & environment',match:/^storage temperature(?:.*)?$/},
 {key:'humidity',label:'Humidity',group:'Protection & environment',match:/^(?:operating(?: storage)? |relative )?humidity(?:.*)?$/},
 {key:'altitude',label:'Operating altitude',group:'Protection & environment',match:/^(?:operating |maximum )?altitude(?:.*)?$/},
 {key:'certifications',label:'Listed certifications',group:'Protection & environment',match:/^(?:certifications|certification|standards|compliance|safety standards)$/},
 {key:'warranty',label:'Product warranty',group:'Warranty',match:/^(?:(?:product |material and workmanship |materials and workmanship |manufacturer )?warranty)(?:.*)?$/},
 {key:'powerWarranty',label:'Power output warranty',group:'Warranty',match:/^(?:power|performance|linear power)(?: output)? warranty(?:.*)?$/,categories:panel},
];
const normal=(s:string)=>s.toLowerCase().replace(/[‐‑–—_-]/g,' ').replace(/[.:：]/g,' ').replace(/\s+/g,' ').trim();
const clean=(s:string)=>s.replace(/\u0000/g,'').replace(/\s+/g,' ').trim();
const number=(s:unknown)=>Number(String(s).replace(/,/g,'').replace(/[−–—]/g,'-').match(/[-+]?\d+(?:\.\d+)?/)?.[0]);
const ratingKey=(label:string):string|undefined=>{
 const l=normal(label);if(/temperature|coefficient|fuse|max.*system/.test(l))return;
 if(/\bvoc\b|open circuit voltage/.test(l))return 'voc';
 if(/\bisc\b|short circuit (?:current|voltage)/.test(l))return 'isc';
 if(/\bvmp\b|\bvmpp\b|(?:optimum operating|maximum power|peak power) voltage/.test(l))return 'vmp';
 if(/\bimp\b|\bimpp\b|(?:optimum operating|maximum power|peak power) current/.test(l))return 'imp';
 if(/\bpmax\b|\bpmpp\b|\bmaximum power\b|\bmax power\b|rated power output|nominal power|peak power|^power output/.test(l))return 'pmax';
};
function usable(value:string){return value.length>0&&value.length<420&&!/^(?:n\/?a|none|not applicable|[-–—]+)$/i.test(value)&&!/(?:regular price|sale price|save \d+%|rated \d out of|shop now|buy now)/i.test(value);}
const measured=new Set(['moduleEfficiency','cellEfficiency','cellCount','noctTemperature','nmotTemperature','pmaxTemperatureCoefficient','vocTemperatureCoefficient','iscTemperatureCoefficient','maxSystemVoltage','maxSeriesFuse','snowLoad','windLoad','voltage','operatingVoltage','capacityAh','capacityKwh','maxDischargeCurrent','peakDischargeCurrent','maxChargeCurrent','chargeVoltage','outputWatts','surgeWatts','acOutput','frequency','efficiency','maxPvVoltage','mpptVoltageRange','mpptCount','maxMpptCurrent','maxPvIsc','maxPvWatts','chargeCurrentA','acChargeWatts','chargeTime','ratedCurrent','ratedVoltage','poles','interruptRating','gauge','length','dimensions','weight','tilt','operatingTemperature','chargeTemperature','dischargeTemperature','humidity','altitude']);
function validMeasurement(key:string,value:string){
 if(['outputWatts','surgeWatts','maxPvWatts','acChargeWatts'].includes(key)&&!(/^\d+(?:\.\d+)?$/.test(value)||/^[~<>≤≥±+−–—\-\s]*(?:(?:up to|max\.?|approximately)\s*)?\d+(?:\.\d+)?\s*k?w(?:atts?)?\b/i.test(value)))return false;
 return !measured.has(key)||/^(?:[~<>≤≥±+−–—\-\s]*(?:(?:up to|max\.?|approximately)\s*)?\d|AWG\s*\d)/i.test(value);
}
function definition(label:string,value:string,category:Category){
 const l=normal(label);return definitions.find(d=>(!d.categories||d.categories.includes(category))&&d.match.test(l)&&(d.key!=='capacityAh'||/^\d+(?:\.\d+)?\s*ah\b/i.test(value)||(/\bah\b/i.test(label)&&/^\d+(?:\.\d+)?$/.test(value)))&&(d.key!=='capacityKwh'||/k?wh\b/i.test(value+' '+label)));
}
/** Converts two-column tables and independently labelled cells. Never parses marketing prose. */
export function technicalRows(rows:string[][]):string[][]{
 const out:string[][]=[];
 for(const row of rows){const cells=row.map(clean);if(!cells.length)continue;
  if(cells.every(c=>!c||/^[^:：]{2,100}[:：]\s*\S/.test(c))){for(const c of cells){const m=c.match(/^([^:：]{2,100})[:：]\s*(.+)$/);if(m)out.push([m[1],m[2]]);}}
  else if(cells.length>=2)out.push(cells.map((c,i)=>i===0?c.replace(/[:：]$/,'').trim():c));
 }
 return out;
}
const fallbackLabels:Record<string,[string,string,string]>={watts:['Rated panel power','Module & cells','W'],face:['Panel face','Module & cells',''],technology:['Cell technology','Module & cells',''],cellType:['Cell type','Module & cells',''],voltage:['Nominal system voltage','Electrical ratings','V'],capacityKwh:['Energy capacity','Capacity & battery','kWh'],capacityAh:['Rated capacity','Capacity & battery','Ah'],chemistry:['Battery chemistry','Capacity & battery',''],formFactor:['Battery format','Capacity & battery',''],outputWatts:['Listed continuous output','AC output','W'],inverterType:['Inverter type','AC output',''],acOutput:['Listed AC output','AC output',''],stationType:['Station format','Identity',''],kitType:['Kit format','Identity',''],mountType:['Mount type','Mounting & fit',''],gauge:['Wire gauge','Cable & connections','AWG'],lengthFt:['Length','Physical specifications','ft'],chargeCurrentA:['Listed charge current','Electrical ratings','A'],controllerType:['Controller type','Identity',''],moduleFunction:['Module function','Identity',''],monitorType:['Monitoring function','Identity',''],subCategory:['Equipment type','Identity','']};
const nouns:Record<Category,string>={panels:'solar panel',batteries:'storage battery','all-in-one':'power station',inverters:'inverter',charging:'charge controller / charger',mounting:'mounting hardware',wiring:'cable / connector',electrical:'electrical component',monitoring:'monitoring / control device','module-electronics':'module electronics',kits:'solar equipment kit',accessories:'equipment accessory'};
export function buildSpecification(product:Product,input?:SpecificationEvidence|SpecificationEvidence[]):ProductSpecification{
 const result:ProductSpecification={summary:'',groups:[],sources:[],notes:[]};
 const fields=new Map<string,SpecificationField>();
 const groupFor=new Map<string,string>();
 const expected=Number(product.specs.watts)||undefined;
 if(product.category==='panels')result.panelRatings={stc:{},noct:{},sources:{}};
 const priority={datasheet:0,manual:1,manufacturer:2,retailer:3};
 const entries=(input?(Array.isArray(input)?input:[input]):[]).sort((a,b)=>priority[a.kind]-priority[b.kind]);
 for(const evidence of entries){
  const rows=technicalRows(evidence.rows);let column=1,noctColumn=-1;
  const header=rows.find(r=>r.slice(1).some(c=>/^STC$/i.test(c)));
  if(header){column=header.findIndex(c=>/^STC$/i.test(c));noctColumn=header.findIndex(c=>/^(?:NOCT|NMOT)$/i.test(c));if(noctColumn>=0&&result.panelRatings)result.panelRatings.noctLabel=header[noctColumn].toUpperCase();
   const power=rows.find(r=>ratingKey(r[0])==='pmax');if(expected&&power&&Math.abs(number(power[column])-expected)>.5){result.notes.push('A source table for a different panel variant was excluded.');continue;}}
  else if(product.category==='panels'){
   const powerRow=rows.find(r=>ratingKey(r[0])==='pmax'&&!/noct|nmot/i.test(r[0]));
   if(powerRow&&expected){const matching=powerRow.slice(1).flatMap((v,i)=>Math.abs(number(v)-expected)<.5?[i+1]:[]);if(matching.length===1)column=matching[0];
    else if(!matching.length){result.notes.push('A source table for a different panel variant was excluded.');continue;}
    else if(matching.length>1&&!header){result.notes.push('Ambiguous panel variant columns were excluded.');continue;}}
  }
  let used=false;
  for(const row of rows){
   const label=row[0],value=row[column];if(!value||!usable(value))continue;
   // Multi-model tables outside panels require explicit matching before reaching this parser.
   if(!header&&row.length>2&&product.category!=='panels')continue;
   if(result.panelRatings){const key=ratingKey(label);if(key){
    if(/bifacial gain|bifacial boost|rear.side gain/i.test(value))continue;
    if(!validMeasurement('voltage',value))continue;
    const unit=key==='pmax'?'W':['voc','vmp'].includes(key)?'V':'A';
    const unitPattern=key==='pmax'?/w(?:att)?s?\b/i:['voc','vmp'].includes(key)?/v(?:dc|olt)?s?\b/i:/a(?:mp)?s?\b/i;
    const bare=/^[-+]?\d+(?:\.\d+)?$/.test(value);if(!bare&&!unitPattern.test(value))continue;
    const measuredValue=bare?value+' '+unit:value;
    const condition=/noct|nmot/i.test(label)?'noct':'stc';
    if(!result.panelRatings[condition][key]){result.panelRatings[condition][key]=measuredValue;result.panelRatings.sources![condition+'.'+key]=evidence.url;used=true;}
    const noctValue=row[noctColumn]||'',bareNoct=/^[-+]?\d+(?:\.\d+)?$/.test(noctValue);
    if(noctColumn>=0&&usable(noctValue)&&(bareNoct||unitPattern.test(noctValue))&&!result.panelRatings.noct[key]){result.panelRatings.noct[key]=bareNoct?noctValue+' '+unit:noctValue;result.panelRatings.sources!['noct.'+key]=evidence.url;used=true;}
    continue;
   }}
   let d=definition(label,value,product.category);
   if(product.category==='panels'&&d?.key==='cellType'&&!/\b[NP][ -]?type\b/i.test(value)){
    if(/topcon|perc|ibc|hpbc|hjt|heterojunction/i.test(value))d={...d,key:'technology',label:'Cell technology'};
    else if(/mono|poly|crystalline/i.test(value))d={...d,key:'cellConstruction',label:'Cell construction'};
   }
   if(!d||fields.has(d.key)||!validMeasurement(d.key,value))continue;
   if(d.key==='dimensions'&&['panels','inverters','batteries','all-in-one','kits'].includes(product.category)&&/^1\s*[×x*]\s*1\s*[×x*]\s*1\s*in\b/i.test(value))continue;
   if(d.key==='moduleEfficiency'&&/bifacial gain|rear.side gain|^up to/i.test(value))continue;
   if(d.key==='moduleEfficiency'&&result.panelRatings){
    result.panelRatings.stc.efficiency=value;result.panelRatings.sources!['stc.efficiency']=evidence.url;
    if(noctColumn>=0&&usable(row[noctColumn]||'')){result.panelRatings.noct.efficiency=row[noctColumn];result.panelRatings.sources!['noct.efficiency']=evidence.url;}
   }
   fields.set(d.key,{key:d.key,label:d.label,value,source:evidence.url,kind:evidence.kind});groupFor.set(d.key,d.group);used=true;
  }
  if(used)result.sources.push({url:evidence.url,kind:evidence.kind,label:evidence.label||(evidence.kind==='datasheet'?'Manufacturer datasheet':evidence.kind==='manufacturer'?'Manufacturer specifications':'Retailer specifications'),...(evidence.model?{model:evidence.model}:{}),...(evidence.checkedAt?{checkedAt:evidence.checkedAt}:{})});
 }
 // Listing identity is visibly distinct from document-sourced measurements.
 let listingUsed=false;
 for(const [key,value] of Object.entries(product.specs)){const d=fallbackLabels[key];if(!d||fields.has(key)||value===''||value===undefined)continue;
  if(key==='lengthFt'&&fields.has('length'))continue;
  if(key==='watts'&&result.panelRatings?.stc.pmax)continue;
  if(key==='watts'&&product.category!=='panels')continue;
  fields.set(key,{key,label:d[0],value:String(value)+(d[2]&&typeof value==='number'?' '+d[2]:''),source:product.sourceUrl,kind:'listing'});groupFor.set(key,d[1]);listingUsed=true;
 }
 if(listingUsed&&!result.sources.some(s=>s.url===product.sourceUrl))result.sources.push({url:product.sourceUrl,kind:'listing',label:'Selected product listing'});
 if(!result.sources.length)result.sources.push({url:product.sourceUrl,kind:'listing',label:'Selected product listing'});
 const model=fields.get('model')?.value;
 const parts=[product.brand,...(model?[model]:[]),nouns[product.category]];
 const concise=(key:string)=>{const v=fields.get(key)?.value;return v&&v.length<45?v:undefined;};
 const highlights=product.category==='panels'?[expected?`${expected} W per panel`:undefined,concise('cellType'),concise('moduleEfficiency')?`${concise('moduleEfficiency')} module efficiency`:undefined]:['batteries','all-in-one'].includes(product.category)?[concise('capacityKwh')||concise('capacityAh'),concise('voltage'),concise('chemistry')]:product.category==='inverters'?[concise('outputWatts'),concise('inverterType'),concise('acOutput')]:[concise('ratedCurrent'),concise('ratedVoltage'),concise('material')];
 result.summary=(parts.join(' ')+'. '+highlights.filter(Boolean).join(' · ')+(highlights.some(Boolean)?'.':'')).slice(0,215).trim();
 for(const field of fields.values()){const title=groupFor.get(field.key)!;let group=result.groups.find(g=>g.title===title);if(!group){group={title,fields:[]};result.groups.push(group);}group.fields.push(field);}
 if(!result.sources.some(s=>s.kind!=='listing'))result.notes.push('A matching technical specification table is not available in the collected sources yet.');
 if(result.panelRatings&&!Object.keys(result.panelRatings.noct).length)result.notes.push('NOCT electrical ratings are not published in the matched sources. NOCT temperature is a separate specification.');
 return result;
}

/** Missing core fields remain visible without becoming measured catalog values. */
export function specificationDisplayGroups(product:Product,details:ProductSpecification){
 const core:Record<Category,string[]>={
  panels:['moduleEfficiency','cellType','cellCount','dimensions','weight'],
  batteries:['voltage','capacityAh','capacityKwh','chemistry','maxChargeCurrent','maxDischargeCurrent','cycleLife','dimensions','weight'],
  'all-in-one':['capacityKwh','chemistry','cycleLife','outputWatts','surgeWatts','acOutput','maxPvVoltage','maxMpptCurrent','maxPvWatts','dimensions','weight'],
  inverters:['outputWatts','surgeWatts','acOutput','frequency','maxPvVoltage','mpptVoltageRange','mpptCount','maxMpptCurrent','efficiency','dimensions','weight'],
  charging:['voltage','chargeCurrentA','maxPvVoltage','mpptVoltageRange','maxPvWatts','efficiency'],
  wiring:['gauge','length','ratedVoltage','ratedCurrent','conductor','connector'],
  mounting:['material','dimensions','compatibility','mountType'],
  electrical:['ratedCurrent','ratedVoltage','poles','ipRating'],
  monitoring:['communications','accuracy','ratedVoltage','dimensions'],
  'module-electronics':['ratedCurrent','ratedVoltage','ipRating','dimensions'],
  kits:['compatibility'],accessories:['compatibility','dimensions','material'],
 };
 const groups=details.groups.map(g=>({...g,fields:[...g.fields]}));
 const keys=new Set(groups.flatMap(g=>g.fields.map(f=>f.key)));
 const required=product.specs.batteryKind==='Battery cabinets'?['dimensions','material','compatibility']:core[product.category];
 for(const key of required){if(keys.has(key)||(key==='length'&&keys.has('lengthFt'))||(['outputWatts','surgeWatts','acOutput'].includes(key)&&product.specs.stationType==='DC-only station (no AC inverter)'))continue;
  const d=definitions.find(d=>d.key===key);if(!d)continue;let group=groups.find(g=>g.title===d.group);if(!group){group={title:d.group,fields:[]};groups.push(group);}group.fields.push({key,label:d.label,value:'Not verified',source:''});
 }
 const order=['Identity','Module & cells','Capacity & battery','Electrical ratings','AC output','Solar input','Charging & connections','Cable & connections','Monitoring & control','Mounting & fit','Physical specifications','Temperature & load ratings','Protection & limits','Protection & environment','Warranty'];
 return groups.sort((a,b)=>order.indexOf(a.title)-order.indexOf(b.title));
}

/** Static evidence applies to both snapshot and database records. Prices remain live. */
export function applySpecificationEvidence(product:Product,index:Record<string,ProductSpecification>):Product{
 const specification=index[product.id];if(!specification)return product;
 if(product.specification===specification)return product;
 if(specification.panelRatings?.stc.pmax&&product.specs.watts&&Math.abs(number(specification.panelRatings.stc.pmax)-Number(product.specs.watts))>.5)return product;
 const specs={...product.specs};
 // Only verified sheet / technical-table STC measurements enter string sizing checks.
 for(const key of ['voc','vmp','imp','isc']){const value=specification.panelRatings?.stc[key];if(value){const n=number(value);if(Number.isFinite(n)&&n>0)specs[key]=n;}}
 for(const field of specification.groups.flatMap(g=>g.fields)){
  if(field.key==='vocTemperatureCoefficient'&&/^[-+]?\d+(?:\.\d+)?\s*%\s*\/\s*[°º]C$/i.test(field.value))specs.vocTempCoefficient=number(field.value);
  if(['maxPvVoltage','maxMpptCurrent','mpptCount','chargeCurrentA','maxDischargeCurrent','maxChargeCurrent'].includes(field.key)){
  if(field.kind!=='listing'&&specification.sources.some(s=>s.url===field.source&&s.kind!=='listing')&&/^\d+(?:\.\d+)?\s*(?:[AV]|VDC|A DC)?$/i.test(field.value)){specs[field.key]=number(field.value);}
 }}
 return {...product,specs,specification};
}
