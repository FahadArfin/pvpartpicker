import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import https from 'node:https';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';
export function publicAddress(address){
 if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51)||a===203&&b===0);}
 if(isIP(address)===6){const s=address.toLowerCase();return /^[23]/.test(s)&&!/^2001:(?:db8|0)(?::|$)/.test(s)&&!/^2002:/.test(s);}
 return false;
}
export async function fetchSource(url){
 const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443'))throw new Error('Invalid source URL');
 const addresses=await lookup(u.hostname,{all:true,verbatim:true});if(!addresses.length||addresses.some(a=>!publicAddress(a.address)))throw new Error('Source resolves to a non-public address');
 // Pin the checked address. HTTPS still verifies the original hostname.
 const chosen=addresses.find(a=>a.family===4)||addresses[0];
 return new Promise((resolve,reject)=>{
  const req=https.request(u,{method:'GET',agent:false,lookup:(_host,options,callback)=>options.all?callback(null,[chosen]):callback(null,chosen.address,chosen.family),headers:{'User-Agent':'PVPartPickerBot/1.0 (+https://github.com/FahadArfin/pvpartpicker)','Accept':'application/json,text/html,application/xml','Accept-Encoding':'identity'}},res=>{
   let bytes=0;const chunks=[];res.on('data',chunk=>{bytes+=chunk.length;if(bytes>6000000){req.destroy(new Error('Response exceeds 6MB'));return;}chunks.push(chunk);});
   res.on('error',reject);res.on('end',()=>{try{let buffer=Buffer.concat(chunks);const encoding=res.headers['content-encoding'];if(encoding==='gzip')buffer=gunzipSync(buffer,{maxOutputLength:6000000});else if(encoding==='br')buffer=brotliDecompressSync(buffer,{maxOutputLength:6000000});else if(encoding&&encoding!=='identity')throw new Error('Unsupported response encoding');resolve({status:res.statusCode,location:res.headers.location,text:buffer.toString('utf8')});}catch(e){reject(e);}});
  });const timer=setTimeout(()=>req.destroy(new Error('Source request timed out')),25000);req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
 });
}
