import {readCatalogState} from '../../lib/catalog-state';
import {CatalogWorkspace} from '../../components/catalog-workspace';
import {pageCatalogUrl} from '../../lib/catalog-client';
export default async function Parts({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const p=await searchParams,query=new URLSearchParams(Object.entries(p).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));
 return <><link rel="preload" href={pageCatalogUrl} as="fetch" crossOrigin="anonymous"/><CatalogWorkspace key={query.toString()} initialFilters={readCatalogState(query)} initialCategory={p.category} initialSearch={p.q} initialEcosystem={p.ecosystem} builderMode={p.builder==='1'}/></>;
}
