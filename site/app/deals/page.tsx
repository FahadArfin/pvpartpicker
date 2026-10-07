import {DealsWorkspace} from '../../components/deals-workspace';
import type {DropPeriod} from '../../lib/price-drops';
export const metadata={title:'Sales & price drops'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const p=await searchParams,period=['day','week','month','latest'].includes(p.period||'')?p.period as DropPeriod:'day';
 return <DealsWorkspace key={(p.view||'')+'|'+(p.period||'')} initialView={p.view==='drops'||p.period?'drops':'sales'} initialPeriod={period}/>;
}
