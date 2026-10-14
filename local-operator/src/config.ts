export const CHAIN=61999;
export const CHAIN_HEX='0xf22f';
export const RPC='https://studio.genlayer.com/api';
export const SOURCE_SHA='cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e';
export const BASE_COMMIT='6b5b546ef9e3265f5164d58af4bb6684ef6ff74f';
export const STEPS=['T01','T02','T03','T04'] as const;
export type Step=typeof STEPS[number];
export const SEEDS={T02:{name:'Prism Beetle',category:'creature',description:'A small beetle refracts moonlight through its prismatic shell. Its antennae sense rhythms and steer each colored beam to match the beat.',features:['prismatic shell refracts moonlight','antennae sense rhythms']},T03:{name:'Echo Loom',category:'object',description:'A portable loom weaves audible tones into threads. Each woven thread stores a vibration and releases its sound when a beam of light touches it.',features:['weaves tones into threads','light releases stored vibrations']}} as const;
export const isAddress=(x:unknown):x is `0x${string}`=>typeof x==='string'&&/^0x[0-9a-f]{40}$/i.test(x)&&!/^0x0{40}$/i.test(x);
export const isHash=(x:unknown):x is `0x${string}`=>typeof x==='string'&&/^0x[0-9a-f]{64}$/i.test(x);
export const same=(a:unknown,b:unknown)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
export function stringify(x:unknown){return JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v,2);}
