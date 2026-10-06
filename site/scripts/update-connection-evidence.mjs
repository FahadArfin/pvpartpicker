// Exact-model manufacturer evidence checked 2026-10-06. No prices are changed.
import fs from 'node:fs';
const file=new URL('../data/specifications.json',import.meta.url),index=JSON.parse(fs.readFileSync(file,'utf8'));
function update(id,url,label,values,notes=[]){
 const p=index[id];if(!p)throw new Error('Missing exact catalog model '+id);
 const keys=new Set(Object.keys(values));
 p.groups=p.groups.map(g=>({...g,fields:g.fields.filter(f=>!keys.has(f.key))})).filter(g=>g.fields.length);
 p.groups.push({title:'Connection planning ratings',fields:Object.entries(values).map(([key,[name,value]])=>({key,label:name,value,source:url,kind:url.endsWith('.pdf')?'datasheet':'manual'}))});
 p.sources=p.sources.filter(s=>s.url!==url);p.sources.unshift({url,kind:url.endsWith('.pdf')?'datasheet':'manual',label,checkedAt:'2026-10-06T00:00:00Z'});
 p.notes=[...new Set([...p.notes,...notes])];
}
const eg4='https://eg4electronics.com/wp-content/uploads/2024/04/';
update('eg4-18kpv',eg4+'EG4-18KPV-12LV-Spec-Sheet.pdf','EG4 18kPV manufacturer sheet v1.4.3',{
 inputsPerMppt:['Direct inputs per MPPT','2 / 1 / 1'],batteryVoltageRange:['Battery voltage range (lithium / lead-acid)','40–60 V'],
});
update('eg4-6000xp',eg4+'EG4-6000XP-Inverter-Spec-Sheet.pdf','EG4 6000XP manufacturer sheet v1.4.4',{
 maxPvVoltage:['Maximum PV input voltage','480 VDC'],mpptCount:['Independent MPPT trackers','2'],mpptVoltageRange:['MPPT operating voltage range','120–385 VDC'],
 maxMpptCurrent:['Maximum operating input current per MPPT','17 A / 17 A'],maxPvIsc:['Maximum short-circuit input current per MPPT','25 A / 25 A'],inputsPerMppt:['Direct inputs per MPPT','1 / 1'],
 maxPvWatts:['Maximum utilized PV power','8000 W'],maxPvWattsPerMppt:['Maximum utilized PV power per MPPT','4000 W / 4000 W'],batteryVoltageRangeLithium:['Battery voltage range (lithium)','46.4–60 V'],batteryVoltageRangeLeadAcid:['Battery voltage range (lead-acid)','38.4–60 V'],
},['6000XP: manufacturer sheet v1.4.4 lists a 480 V DC input ceiling. This supersedes the older 500 V catalog value. Battery input ranges depend on chemistry; cutoff and recovery settings still require review.']);
update('santan-solar-eg4-lifepower4v2-48v-100ah','https://eg4electronics.com/wp-content/uploads/2024/06/EG4-LifePower4-Spec-Sheet.pdf','EG4 LifePower4 48V V2 manufacturer sheet v1.1.2',{
 voltage:['Nominal voltage','51.2 V'],chemistry:['Battery chemistry','LiFePO4'],capacityKwh:['Nameplate energy','5.12 kWh'],chargeVoltage:['Recommended bulk / absorb voltage','56.8 V'],maxChargeCurrent:['Maximum continuous charging current','100 A'],maxDischargeCurrent:['Maximum continuous discharge current','100 A'],
},['BMS low/high protection thresholds are not a recommended operating envelope. Connection checks leave the full operating-voltage envelope unverified until an explicit operating range is documented.']);
fs.writeFileSync(file,JSON.stringify(index));
console.log('Updated exact-model connection evidence for EG4 18kPV, 6000XP and LifePower4 V2.');
