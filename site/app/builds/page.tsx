import {redirect} from 'next/navigation';
import {BuildsLanding} from '../../components/builds-landing';
export const metadata={title:'Builds'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const {view}=await searchParams;
  if(view==='saved')redirect('/builds/saved');
  if(view==='community')redirect('/builds/community');
  return <BuildsLanding/>;
}
