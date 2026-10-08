'use client';
import {BuildOpenAction} from './build-open-action';
import type {BuildSettings} from '../lib/types';
const examples:{name:string;purpose:BuildSettings['purpose'];description:string}[]=[
 {name:'Off-grid planning template',purpose:'offgrid',description:'Plan solar charging and storage for independent loads. Choose exact equipment and verify the load and wiring requirements.'},
 {name:'Home backup planning template',purpose:'hybrid',description:'Plan a hybrid or backup system. Confirm approved inverter modes, battery support and transfer equipment.'},
 {name:'Grid-tied planning template',purpose:'gridtie',description:'Plan utility-connected solar. Separate batteries are optional; utility approval and electrical design still need review.'},
];
export function BuildPlanningExamples(){return <section id="planning-examples" className="build-planning-examples"><h2>Example planning templates</h2><p>Starting directions, separate from community submissions. These contain no selected products, prices or verified system design.</p><div>{examples.map(e=><article key={e.purpose}><h3>{e.name}</h3><p>{e.description}</p><BuildOpenAction target={{name:e.name,lines:[],settings:{purpose:e.purpose,mount:'roof'}}} label="Start this plan" navigate/></article>)}</div></section>;}
