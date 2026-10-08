import estimateIndex from '../../../data/specification-estimates.json';
import specAudit from '../../../data/specification-audit.json';
import {applicableEstimates,type SpecEstimate} from '../../../lib/specification-estimates';
import {productDisplayName} from '../../../lib/bundles';
import {notFound} from 'next/navigation';
import {getPageCatalog as getCatalog} from '../../../lib/storage';
import {ProductDetail} from '../../../components/product-detail';
import {modelPurchaseOptions} from '../../../lib/model-identity';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const{id}=await params;const p=(await getCatalog()).products.find(p=>p.id===id);return {title:p?productDisplayName(p):'Product not found',description:p?.description.slice(0,160)};}
export default async function ProductPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){const{id}=await params;const catalog=await getCatalog(),p=catalog.products.find(p=>p.id===id);if(!p)notFound();const choices=modelPurchaseOptions(p,catalog.products).map(p=>({...p,description:'',images:[],specification:undefined}));return <ProductDetail key={p.id} product={p} purchaseChoices={choices} specEstimates={applicableEstimates(p,(estimateIndex as Record<string,{identity:string;fields:SpecEstimate[]}>)[p.id])} specGap={specAudit.missing.find(x=>x.productId===p.id)?.reason} builderMode={(await searchParams).builder==='1'}/>;}
