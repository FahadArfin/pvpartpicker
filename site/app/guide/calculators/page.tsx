import CalculatorWorkshop from '../../../components/guide-calculator-workshop';
export const metadata={title:'Calculator workshop',description:'Nine solar planning tools adapted from Solar4U, with transparent methods and assumptions.'};
export default async function Calculators({searchParams}:{searchParams:Promise<{tool?:string}>}){const {tool}=await searchParams;return <CalculatorWorkshop initialTool={tool}/>;}
