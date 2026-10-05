import GuideHub from '../../components/guide-hub';
import GuideReader from '../../components/guide-reader';
import {guideEntries,guideArticles} from '../../lib/guide-content';
export const metadata={title:'Guide',description:'Practical solar guides, nine calculators and sourced news for beginners and experienced builders.'};
export default async function Guide({searchParams}:{searchParams:Promise<{view?:string}>}){const params=await searchParams;return params.view==='library'?<GuideHub entries={guideEntries}/>:<GuideReader article={guideArticles.find(a=>a.slug==='solar-energy-path')!} home/>;}
