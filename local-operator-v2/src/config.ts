export const CHAIN=61999;
export const CHAIN_HEX='0xf22f';
export const RPC='https://studio.genlayer.com/api';
export const SOURCE_SHA='4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1';
export const BASE_COMMIT='67a14c4c8b09b44e67c11a762fbc28f0f9008c49';
export const STEPS=['T01','T02','T03','T04'] as const;
export type Step=typeof STEPS[number];
export const SEEDS={T02:{name:'Prism Beetle',category:'creature',description:'A small beetle refracts moonlight through its prismatic shell. Its antennae sense rhythms and steer each colored beam to match the beat.',features:['prismatic shell refracts moonlight','antennae sense rhythms']},T03:{name:'Echo Loom',category:'object',description:'A portable loom weaves audible tones into threads. Each woven thread stores a vibration and releases its sound when a beam of light touches it.',features:['weaves tones into threads','light releases stored vibrations']}} as const;
export const isAddress=(x:unknown):x is `0x${string}`=>typeof x==='string'&&/^0x[0-9a-f]{40}$/i.test(x)&&!/^0x0{40}$/i.test(x);
export const isHash=(x:unknown):x is `0x${string}`=>typeof x==='string'&&/^0x[0-9a-f]{64}$/i.test(x);
export const same=(a:unknown,b:unknown)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
export function stringify(x:unknown){return JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v,2);}

export const CONTRACT_VERSION='SPLICE-V2';
export const V1_CONTRACT='0x49FA79fB4Ff5C924F9FbA0a2E16558E3A7Db8D38';
export const DEPLOYMENT_ENABLED=true; // FAST-2G: four local, individually confirmed attempts only.
