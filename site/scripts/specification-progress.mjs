/** Snapshot only: no source network requests or price writes. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {researchProgress} from '../lib/specification-progress.ts';
const args=process.argv.slice(2),arg=name=>{const n=args.indexOf(name);if(n<0||!args[n+1])throw Error('Required '+name);return resolve(args[n+1]);};
const report=JSON.parse(await readFile(arg('--report'),'utf8')),sweep=JSON.parse(await readFile(arg('--sources'),'utf8'));
const progress=researchProgress(report,sweep.failures||[]);
await writeFile(new URL('../data/specification-progress.json',import.meta.url),JSON.stringify(progress,null,2));console.log(JSON.stringify(progress));
