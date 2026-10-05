import CalculatorWorkshop from '../../../components/guide-calculator-workshop';
import {guideEntries} from '../../../lib/guide-content';
export const metadata={title:'Calculator workshop',description:'Nine solar planning tools adapted from Solar4U, with transparent methods and assumptions.'};
export default async function Calculators({searchParams}:{searchParams:Promise<{tool?:string;article?:string}>}){
 const {tool,article:slug}=await searchParams;
 const entry=guideEntries.find(e=>e.slug===slug);
 const article=entry?{slug:entry.slug,title:entry.title}:slug==='library'?{slug:'library',title:'All articles & filters'}:undefined;
 return <CalculatorWorkshop initialTool={tool} article={article}/>;
}
