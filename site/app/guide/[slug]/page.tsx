import {notFound} from 'next/navigation';
import GuideReader from '../../../components/guide-reader';
import {guideArticles} from '../../../lib/guide-content';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const a=guideArticles.find(a=>a.slug===slug);return{title:a?.title??'Article not found',description:a?.summary};}
export default async function GuideArticlePage({params}:Props){const {slug}=await params;const a=guideArticles.find(a=>a.slug===slug);if(!a)notFound();return <GuideReader article={a}/>;}
