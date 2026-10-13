import type {Work,SeedInput,Progress} from './types';
export const shortAddress=(s:string)=>s.slice(0,6)+'…'+s.slice(-4);
export function choosePair(pair:Work[],work:Work):Work[]{
 if(work.kind!=='seed')return pair;
 if(pair.some(w=>w.id===work.id))return pair.filter(w=>w.id!==work.id);
 return pair.length<2?[...pair,work]:[pair[1],work];
}
export function pairError(pair:Work[]):string|null{
 if(pair.length!==2)return 'Pick two seeds to start.';
 if(pair[0].id===pair[1].id)return 'Choose two different seeds.';
 if(pair.some(w=>w.kind!=='seed'))return 'V1 fuses seeds only.';
 if(pair[0].creator.toLowerCase()===pair[1].creator.toLowerCase())return 'Pick seeds from two different creators.';
 return null;
}
export function validateSeed(s:SeedInput):string|null{
 if(s.name.trim().length<2||s.name.trim().length>48)return 'Name: 2–48 characters.';
 if(s.description.trim().length<20||s.description.trim().length>360)return 'Description: 20–360 characters.';
 if(s.features.length<1||s.features.length>3||s.features.some(f=>f.trim().length<3||f.trim().length>80)||new Set(s.features.map(f=>f.trim())).size!==s.features.length)return 'Use 1–3 distinct features, 3–80 characters each.';
 if(!s.allow)return 'Choose public derivation to register a seed.';
 if([s.name,s.description,...s.features].some(v=>/[\u0000-\u001f\u007f]/.test(v)))return 'Remove control characters.';
 return null;
}
export function parseWork(value:unknown):Work{
 const w=typeof value==='string'?JSON.parse(value):value;
 if(!w||typeof w!=='object'||!Number.isSafeInteger(w.id)||w.id<1||!['seed','fusion'].includes(w.kind)||typeof w.name!=='string'||typeof w.description!=='string'||!Array.isArray(w.features)||!w.features.every((s:unknown)=>typeof s==='string')||typeof w.creator!=='string'||!/^0x[0-9a-f]{40}$/i.test(w.creator)||!Array.isArray(w.parents)||!w.parents.every(Number.isSafeInteger)||!Array.isArray(w.parent_creators)||!['creature','object','world','wildcard'].includes(w.category)||w.version!=='SPLICE-V1'||w.license!=='PUBLIC-DERIVATION-V1')throw new Error('Invalid contract response.');
 if((w.kind==='seed'&&(w.parents.length!==0||w.depth!==0))||(w.kind==='fusion'&&(w.parents.length!==2||w.parents[0]===w.parents[1]||w.depth!==1)))throw new Error('Invalid lineage response.');
 return w as Work;
}
export function lifecycle(tx:{statusName?:unknown;status?:unknown;resultName?:unknown;txExecutionResultName?:unknown;result?:unknown;txExecutionResult?:unknown}):Progress{
 const status=String(tx.statusName??tx.status??'UNKNOWN').toUpperCase();
 if(['UNDETERMINED','CANCELED','VALIDATORS_TIMEOUT','LEADER_TIMEOUT'].includes(status))return {phase:'failed',label:`Consensus stopped: ${status}. No work confirmed.`};
 if(status==='FINALIZED'||status==='7'){
  if(tx.txExecutionResultName==='FINISHED_WITH_ERROR'||tx.txExecutionResult===2)return {phase:'rejected',label:'Finalized with contract error. No creation confirmed.'};
  if((tx.resultName==='MAJORITY_AGREE'||tx.result===6)&&(tx.txExecutionResultName==='FINISHED_WITH_RETURN'||tx.txExecutionResult===1))return {phase:'finalized',label:'Finalized. Checking the saved work…'};
  return {phase:'failed',label:'Finalized without verified agreement and successful execution.'};
 }
 if(status==='ACCEPTED'||status==='5')return {phase:'accepted',label:'Accepted — waiting for finalization.'};
 return {phase:'pending',label:`Consensus: ${status.toLowerCase().replaceAll('_',' ')}.`};
}
