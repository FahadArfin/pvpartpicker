export type ConductorMaterial='copper'|'aluminum';
// Southwire Power Cable Installation Guide, table 2-6: Class B stranded,
// uncoated copper / aluminum, DC resistance in ohms per 1,000 ft at 25°C.
export const conductorSource='https://www.southwire.com/medias/sys_master/installation-manuals/installation-manuals/hc5/hcd/8887676076062/Power-Cable-Installation-Guide-Southwire.pdf#page=31';
export const conductors=[
 ['14 AWG',2.63,4.31],['12 AWG',1.66,2.70],['10 AWG',1.04,1.70],
 ['8 AWG',0.652,1.07],['6 AWG',0.411,0.675],['4 AWG',0.258,0.424],
 ['3 AWG',0.205,0.336],['2 AWG',0.162,0.265],['1 AWG',0.129,0.211],
 ['1/0 AWG',0.102,0.168],['2/0 AWG',0.0810,0.133],['3/0 AWG',0.0642,0.105],['4/0 AWG',0.0510,0.0836],
] as const;
export function conductorResistance(gauge:string,material:ConductorMaterial,temperatureC:number){
 const row=conductors.find(c=>c[0]===gauge);
 if(!row||!['copper','aluminum'].includes(material)||!Number.isFinite(temperatureC)||temperatureC<0||temperatureC>100)throw new Error('Check conductor size, material and temperature (0–100°C).');
 return row[material==='copper'?1:2]*(1+(material==='copper'?0.00385:0.00395)*(temperatureC-25));
}
export function conductorComparison(v:{voltage:number;currentA:number;targetPercent:number;temperatureC:number;material:ConductorMaterial;lengths:number[]}){
 if(!Number.isFinite(v.voltage)||v.voltage<=0||v.voltage>1000||!Number.isFinite(v.currentA)||v.currentA<0||v.currentA>1000||!Number.isFinite(v.targetPercent)||v.targetPercent<=0||v.targetPercent>10||!v.lengths.length||v.lengths.length>30||v.lengths.some(l=>!Number.isFinite(l)||l<=0||l>10000))throw new Error('Check comparison voltage, current, drop target and positive one-way lengths.');
 return conductors.map(c=>{const resistance=conductorResistance(c[0],v.material,v.temperatureC);return{gauge:c[0],resistance,cells:v.lengths.map(lengthFt=>{
  const dropVolts=2*lengthFt*v.currentA*resistance/1000,dropPercent=dropVolts/v.voltage*100;
  return{lengthFt,dropVolts,dropPercent,maxCurrentA:v.voltage*v.targetPercent/100*1000/(2*lengthFt*resistance),withinTarget:dropPercent<=v.targetPercent};
 })};});
}
