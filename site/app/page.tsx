import {readCatalogState} from '../lib/catalog-state';
import {CatalogWorkspace} from '../components/catalog-workspace';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;return <CatalogWorkspace initialFilters={readCatalogState(new URLSearchParams(Object.entries(p).filter((entry):entry is [string,string]=>typeof entry[1]==='string')))} initialCategory={p.category} initialSearch={p.q} initialEcosystem={p.ecosystem} builderMode={p.builder==='1'}/>;}
