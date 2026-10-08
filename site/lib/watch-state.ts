/** Keep completed watch writes current even before React commits a render. */
export async function commitWatchChange(state:{current:string[]},id:string,watched:boolean,persist:()=>Promise<void>,render:(ids:string[])=>void){
 await persist();
 const next=watched?[id,...state.current.filter(value=>value!==id)]:state.current.filter(value=>value!==id);
 state.current=next;
 render(next);
}
/** Batch persistence completes before changing visible state; other watches survive. */
export async function commitWatchBatch(state:{current:string[]},ids:string[],watched:boolean,persist:(next:string[])=>Promise<void>,render:(ids:string[])=>void){
 const group=[...new Set(ids)],selected=new Set(group);
 const merge=()=>watched?[...group,...state.current.filter(id=>!selected.has(id))]:state.current.filter(id=>!selected.has(id));
 const planned=merge();if(planned.length>500)throw Error('Your watch list can hold up to 500 products.');
 await persist(planned);const next=merge();state.current=next;render(next);
}
