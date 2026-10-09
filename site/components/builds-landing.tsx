import {FolderOpen,Users,Wrench} from 'lucide-react';
import Link from './site-link';

import {BuildExamples} from './build-examples';

const actions=[
  {id:'start',label:'Current build',href:'/build',icon:Wrench,description:'Choose your equipment and put your solar system together.'},
  {id:'saved',label:'Saved builds',href:'/builds/saved',icon:FolderOpen,description:'Pick up a setup you saved on this device or in your account.'},
  {id:'community',label:'Community builds',href:'/builds/community',icon:Users,description:'Explore community-made systems and open a copy to make your own.'},
];

export function BuildsLanding(){
  return <main className="page-container builds-landing">
    <h1 className="sr-only">Builds</h1>
    <nav className="build-hub-nav" aria-label="Build options">
      {actions.map(({id,label,href,icon:Icon})=><Link key={id} href={href} className={'build-hub-link'+(id==='start'?' primary':'')} aria-labelledby={'build-option-'+id}>
        <span className="build-hub-icon"><Icon size={25} strokeWidth={1.7} aria-hidden="true"/></span>
        <span id={'build-option-'+id}>{label}</span>

      </Link>)}
    </nav>
    <BuildExamples/>
  </main>;
}
