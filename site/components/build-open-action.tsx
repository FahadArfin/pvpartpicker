'use client';
import {useState} from 'react';
import type {Build} from '../lib/types';
import {copyBuild,buildSwitchNeedsConfirmation,targetAfterBuildSave} from '../lib/build-library';
import {usePV} from './pv-provider';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from './ui/alert-dialog';

export function BuildOpenAction({target,label='Open build',copy=false,navigate=false,className='button dark small',onOpened}:{target:Build;label?:string;copy?:boolean;navigate?:boolean;className?:string;onOpened?:()=>void}){
 const {build,setBuild,draftReady,save,saving,notify}=usePV();const [confirm,setConfirm]=useState(false);
 function open(targetBuild:Build=target){try{const next=copy?copyBuild(targetBuild):{...copyBuild(targetBuild),...(targetBuild.id?{id:targetBuild.id}:{}),...(targetBuild.shareId?{shareId:targetBuild.shareId}:{})};localStorage.setItem('pvpartpicker-draft',JSON.stringify(next));setBuild(next);setConfirm(false);onOpened?.();if(navigate)window.location.assign('/build');else notify(copy?'A copy is ready to edit.':'Build opened.');}catch(e){notify((e as Error).message);}}
 return <><button className={className} disabled={!draftReady||saving} onClick={()=>{if(buildSwitchNeedsConfirmation(build,target,copy))setConfirm(true);else open();}}>{label}</button><AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent className="build-dialog"><AlertDialogHeader><AlertDialogTitle>Switch builds?</AlertDialogTitle><AlertDialogDescription>Your current draft, “{build.name}”, will be replaced. Save it first if you want to keep these changes.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="build-dialog-actions"><AlertDialogCancel className="button outline small">Cancel</AlertDialogCancel><button className="button outline small" disabled={saving} onClick={()=>open()}>Open without saving</button><button className="button dark small" disabled={saving} onClick={async()=>{const id=await save();if(id)open(targetAfterBuildSave(build,target,id,copy));}}>{saving?'Saving…':'Save current & open'}</button></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}
