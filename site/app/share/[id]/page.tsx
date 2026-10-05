import {database} from '../../../lib/storage';
import {notFound} from 'next/navigation';
import {validateBuild} from '../../../lib/domain';
import {SharedBuildView} from '../../../components/shared-build-view';
export const metadata={title:'Shared solar build'};
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))notFound();const row=await database().prepare('SELECT json FROM builds WHERE share_id=?').bind(id).first<{json:string}>();if(!row)notFound();return <SharedBuildView build={validateBuild(JSON.parse(row.json))}/>;}
