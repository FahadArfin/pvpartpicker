import {AccountWorkspace} from '../../components/account-workspace';
export const metadata={title:'My account'};
export default async function Page({searchParams}:{searchParams:Promise<{tab?:string}>}){const p=await searchParams;return <AccountWorkspace initialTab={p.tab}/>;}
