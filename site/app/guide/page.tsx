import GuideHub from '../../components/guide-hub';
import {guideEntries} from '../../lib/guide-content';
export const metadata={title:'Guide',description:'Practical solar guides, nine calculators and sourced news for beginners and experienced builders.'};
export default function Guide(){return <GuideHub entries={guideEntries}/>;}
