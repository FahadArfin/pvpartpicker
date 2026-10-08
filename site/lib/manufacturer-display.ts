/** Display/filter aliases only. Original listing brands remain untouched. */
const aliases:Record<string,string>={richsolar:'Rich Solar',sungoldpower:'SunGoldPower',sungold:'SunGoldPower',renogyus:'Renogy',ecoflowus:'EcoFlow',eg4electronics:'EG4',bluetti:'Bluetti',ecoworthy:'Eco-Worthy',apsystems:'APsystems',integrarack:'Integra Rack',solax:'SolaX',pecron:'Pecron',ruixu:'RUiXU',ecoflow:'EcoFlow',eg4:'EG4',renogy:'Renogy',victron:'Victron',victronenergy:'Victron',solark:'Sol-Ark',canadiansolar:'Canadian Solar',bigbattery:'BigBattery',powmr:'PowMr'};
export const unknownManufacturer='Unknown / retailer-listed';
export function manufacturerDisplay(brand:string):string{
 const label=brand.trim().replace(/\s+(?:llc|inc\.?|ltd\.?|limited|co\.?)$/i,'').trim();
 const key=label.toLowerCase().replace(/[^a-z0-9]/g,'');
 if(!key||/^(mystore|unknown|generic|unbranded|na|none|other|santansolar|santan|seemanufacturer|shopsolarcom|shopsolar|shopsolarkits|signaturesolar|currentconnected)$/.test(key))return unknownManufacturer;
 return aliases[key]??label;
}
export function manufacturerOptions(brands:string[]):string[]{return [...new Set(brands.map(manufacturerDisplay))].sort((a,b)=>a===unknownManufacturer?1:b===unknownManufacturer?-1:a.localeCompare(b));}
