'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap,Marker} from 'leaflet';
import type {AnalyticsLocation} from '../lib/build-analytics';
import 'leaflet/dist/leaflet.css';

// On-demand visible tiles only; honor browser caching and show OSM attribution.
const tileUrl='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export default function AnalyticsLocationMap({location,onChoose}:{location?:AnalyticsLocation;onChoose:(location:AnalyticsLocation)=>void}) {
 const element=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),marker=useRef<Marker|null>(null),choose=useRef(onChoose),last=useRef(location);
 const [error,setError]=useState(''),[ready,setReady]=useState(false);
 choose.current=onChoose;last.current=location;
 useEffect(()=>{
  let cancelled=false;
  void import('leaflet').then(L=>{
   if(cancelled||!element.current)return;
   const initial=last.current;
   const m=L.map(element.current,{scrollWheelZoom:false,minZoom:2,maxZoom:18}).setView(initial?[initial.latitude,initial.longitude]:[20,0],initial?15:2);map.current=m;
   L.tileLayer(tileUrl,{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',maxZoom:18,keepBuffer:0}).on('tileerror',()=>setError('Map imagery is unavailable. Coordinates and address search still work.')).addTo(m);
   const icon=L.divIcon({className:'analytics-map-pin',html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]});
   const point=(latitude:number,longitude:number)=>{const lon=((longitude+180)%360+360)%360-180;if(Math.abs(latitude)>66){setError('Production estimates support locations between 66°S and 66°N.');return;}setError('');choose.current({latitude:Number(latitude.toFixed(5)),longitude:Number(lon.toFixed(5)),label:'Selected map location'});};
   marker.current=L.marker(initial?[initial.latitude,initial.longitude]:[0,0],{icon,draggable:true,keyboard:true,title:'Solar location — drag to adjust'}).on('dragend',()=>{const p=marker.current!.getLatLng();point(p.lat,p.lng);});
   if(initial)marker.current.addTo(m);
   m.on('click',e=>point(e.latlng.lat,e.latlng.lng));
   setReady(true);
  }).catch(()=>setError('Could not load the map. Use address search or coordinates.'));
  return()=>{cancelled=true;map.current?.remove();map.current=null;marker.current=null;};
 },[]);
 useEffect(()=>{const m=map.current,p=marker.current;if(!location||!m||!p||!ready)return;p.setLatLng([location.latitude,location.longitude]);if(!m.hasLayer(p))p.addTo(m);m.setView([location.latitude,location.longitude],Math.max(m.getZoom(),15),{animate:!window.matchMedia('(prefers-reduced-motion: reduce)').matches});},[location?.latitude,location?.longitude,ready]);
 return <div className="analytics-map-wrap"><div ref={element} className="analytics-location-map" role="region" aria-label="Solar location map. Click to select, drag the marker, or use coordinates below."/>{!ready&&!error&&<p className="micro" role="status">Loading interactive map…</p>}{error&&<p className="inline-note" role="status">{error}</p>}<div className="analytics-map-footer"><span>Click a point or drag the pin.</span><button className="button outline small" disabled={!ready} onClick={()=>{const p=map.current!.getCenter();if(Math.abs(p.lat)>66){setError('Choose a location between 66°S and 66°N.');return;}onChoose({latitude:Number(p.lat.toFixed(5)),longitude:Number((((p.lng+180)%360+360)%360-180).toFixed(5)),label:'Selected map center'});}}>Use map center</button></div></div>;
}
