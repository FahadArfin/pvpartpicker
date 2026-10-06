import type {BuildHistory,BuildHistoryPoint} from './build-price-history.ts';
export type HistoryChartPoint=BuildHistoryPoint&{total:number|null}&{[key:`part${number}`]:[number,number]|null};
// Explicit lower/upper bands avoid stacked-chart libraries treating missing
// values as zero. Every tracked band breaks at an incomplete checkpoint.
export function buildHistoryChartPoints(history:BuildHistory):HistoryChartPoint[]{
 const tracked=history.series.filter(s=>s.hasHistory);
 return history.points.map(point=>{
  const ready=tracked.length>0&&tracked.every(s=>point.prices[s.productId]!=null);
  const bands:Record<string,[number,number]|null>={};let total=0;
  for(const s of tracked){const value=point.prices[s.productId]?.cost||0;bands['part'+history.series.indexOf(s)]=ready?[total,Math.round((total+value)*100)/100]:null;total+=value;}
  return {...point,...bands,total:ready?Math.round(total*100)/100:null};
 });
}
