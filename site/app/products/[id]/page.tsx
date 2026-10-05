import {productDisplayName} from '../../../lib/bundles';
import {notFound} from 'next/navigation';
import {getPageCatalog as getCatalog} from '../../../lib/storage';
import {ProductDetail} from '../../../components/product-detail';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const{id}=await params;const p=(await getCatalog()).products.find(p=>p.id===id);return {title:p?productDisplayName(p):'Product not found',description:p?.description.slice(0,160)};}
export default async function ProductPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){const{id}=await params;const p=(await getCatalog()).products.find(p=>p.id===id);if(!p)notFound();return <ProductDetail product={p} builderMode={(await searchParams).builder==='1'}/>;}
