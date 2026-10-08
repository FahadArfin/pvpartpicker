import {ArrowRight,FolderOpen,Users,Wrench} from 'lucide-react';
import Link from './site-link';

import {BuildPlanningExamples} from './build-planning-examples';

const actions=[
  {id:'start',label:'Current build',href:'/build',icon:Wrench,description:'Choose your equipment and put your solar system together.'},
  {id:'saved',label:'Saved builds',href:'/builds/saved',icon:FolderOpen,description:'Pick up a setup you saved on this device or in your account.'},
  {id:'community',label:'Community builds',href:'/builds/community',icon:Users,description:'Explore community-made systems and open a copy to make your own.'},
];

export function BuildsLanding(){
  return <main className="page-container builds-landing">
    <header className="page-intro"><div><h1>Builds</h1><p>Start your solar system, pick up where you left off, or find inspiration.</p></div></header>
    <nav className="builds-landing-actions" aria-label="Build options">
      {actions.map(({id,label,href,icon:Icon,description})=><Link key={id} href={href} className={'builds-landing-action'+(id==='start'?' primary':'')} aria-labelledby={'build-option-'+id}>
        <Icon size={25} strokeWidth={1.7} aria-hidden="true"/>
        <div><h2 id={'build-option-'+id}>{label}</h2><p>{description}</p></div>
        <ArrowRight size={18} aria-hidden="true"/>
      </Link>)}
    </nav>
    <BuildPlanningExamples/>
  </main>;
}
