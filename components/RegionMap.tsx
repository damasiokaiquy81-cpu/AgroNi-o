'use client';
import {useState} from 'react';
import {MapContainer,TileLayer,Marker,Popup} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
const icon=L.divIcon({className:'map-pin',html:'<span></span>',iconSize:[20,20]});
export default function RegionMap({lat,lon,name}:{lat:number;lon:number;name:string}){
 const [failed,setFailed]=useState(false);
 return <div style={{position:'relative',height:'100%',width:'100%'}}><MapContainer key={name} center={[lat,lon]} zoom={8} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}><TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{tileerror:()=>setFailed(true)}}/><Marker position={[lat,lon]} icon={icon}><Popup>{name}<br/>Localização municipal de referência. Sem camada oficial de risco.</Popup></Marker></MapContainer>{failed&&<div className="map-error">Mapa base indisponível. Verifique a conexão com OpenStreetMap.</div>}</div>
}
