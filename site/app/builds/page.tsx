import {BuildsWorkspace} from '../../components/builds-workspace';
export const metadata={title:'Saved & community builds'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  return <BuildsWorkspace view={(await searchParams).view==='community'?'community':'saved'}/>;
}
