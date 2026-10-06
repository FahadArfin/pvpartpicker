import {TierWorkspace} from '../../components/tier-workspace';
export const metadata={title:'Solar tier lists | PVPartPicker',description:'Research-backed solar equipment tiers with price value, strengths, trade-offs and linked evidence.'};
export default async function Tiers({searchParams}:{searchParams:Promise<{model?:string}>}){const params=await searchParams;return <TierWorkspace key={params.model||'default'} initialId={params.model}/>;}
