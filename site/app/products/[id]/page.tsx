import {notFound} from 'next/navigation';
import {getCatalog} from '../../../lib/storage';
import {ProductDetail} from '../../../components/product-detail';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const{id}=await params;const p=(await getCatalog()).products.find(p=>p.id===id);return {title:p?.name||'Product not found',description:p?.description.slice(0,160)};}
export default async function ProductPage({params}:{params:Promise<{id:string}>}){const{id}=await params;const p=(await getCatalog()).products.find(p=>p.id===id);if(!p)notFound();return <ProductDetail product={p}/>;}
