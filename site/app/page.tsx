import {CatalogWorkspace} from '../components/catalog-workspace';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;return <CatalogWorkspace initialCategory={p.category} initialSearch={p.q}/>;}
