import {notFound} from 'next/navigation';
import {database} from '../../../lib/storage';
import {getCommunityBuild} from '../../../lib/community-builds';
import {SharedBuildView} from '../../../components/shared-build-view';
export const metadata={title:'Community solar build'};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))notFound();const entry=await getCommunityBuild(database(),id);if(!entry)notFound();return <SharedBuildView build={entry.build} community description={entry.description} publishedAt={entry.publishedAt}/>;}
