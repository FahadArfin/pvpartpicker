import {redirect} from 'next/navigation';
import {HomeWorkspace} from '../components/home-workspace';
import {legacyCatalogDestination} from '../lib/home-navigation';

export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const destination=legacyCatalogDestination(await searchParams);
  if(destination)redirect(destination);
  return <HomeWorkspace/>;
}
