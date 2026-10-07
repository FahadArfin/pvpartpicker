/** Keep completed watch writes current even before React commits a render. */
export async function commitWatchChange(state:{current:string[]},id:string,watched:boolean,persist:()=>Promise<void>,render:(ids:string[])=>void){
 await persist();
 const next=watched?[id,...state.current.filter(value=>value!==id)]:state.current.filter(value=>value!==id);
 state.current=next;
 render(next);
}
