import {SOURCE_SHA,SEEDS,isAddress,same} from './config';
import {sha} from './sdk';
import type {Entry,State} from './store';
export const parsed=(x:any)=>typeof x==='string'?JSON.parse(x):x;
export function canonical(value:any):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>canonical(k)+':'+canonical(value[k])).join(',')+'}';
}
export const digest=(x:any)=>sha(new TextEncoder().encode(canonical(x)));
export function workShape(value:any){const w=parsed(value);if(!w||!Number.isSafeInteger(w.id)||w.id<1||!isAddress(w.creator)||w.version!=='SPLICE-V1'||w.license!=='PUBLIC-DERIVATION-V1'||!Array.isArray(w.features)||!w.features.every((f:any)=>typeof f==='string')||typeof w.name!=='string'||typeof w.description!=='string'||!Array.isArray(w.parents)||!Array.isArray(w.parent_creators))throw new Error('READBACK BLOCKED: 作品结构错误。');return w;}
export async function verifySeed(value:any,entry:Entry,id:number){
 const w=workShape(value);const step=entry.plan.step;if(step!=='T02'&&step!=='T03')throw new Error('Wrong seed stage');const seed=SEEDS[step];
 if(w.id!==id||w.kind!=='seed'||w.depth!==0||!same(w.creator,entry.plan.account)||w.name!==seed.name||w.description!==seed.description||w.category!==seed.category||canonical(w.features)!==canonical(seed.features)||w.parents.length||w.parent_creators.length)throw new Error('READBACK BLOCKED: 真实种子与批准输入不符。');
 const payload={kind:'seed',name:seed.name,description:seed.description,features:[...seed.features],category:seed.category,parents:[],parent_creators:[],depth:0};
 if(w.request_fingerprint!==await digest(payload))throw new Error('READBACK BLOCKED: seed 请求指纹不符。');return w;
}
export async function verifyFusion(s:State,value:any,lineageValue:any,id:number){
 const w=workShape(value),lineage=parsed(lineageValue);const pa=s.entries.T02?.reads.work,pb=s.entries.T03?.reads.work;
 if(!pa||!pb||same(pa.creator,pb.creator))throw new Error('READBACK BLOCKED: 缺少不同创作者的真实父作品。');
 const parents=[pa,pb].sort((a,b)=>a.id-b.id);
 const hashes=await Promise.all(parents.map(digest));const inputHash=await digest({version:'SPLICE-V1',parents});
 if(w.id!==id||w.kind!=='fusion'||w.depth!==1||w.category!=='wildcard'||!same(w.creator,s.walletA)||canonical(w.parents)!==canonical(parents.map(p=>p.id))||!w.parent_creators.every((a:any,i:number)=>same(a,parents[i]?.creator))||w.parent_creators.length!==2||canonical(w.parent_hashes)!==canonical(hashes)||w.input_hash!==inputHash||w.request_fingerprint!==await digest({snapshot:canonical({version:'SPLICE-V1',parents})})||canonical(lineage.work)!==canonical(w)||canonical(lineage.parents)!==canonical(parents))throw new Error('READBACK BLOCKED: 融合谱系或哈希不符。');
 const validText=(x:any,min:number,max:number)=>typeof x==='string'&&[...x.trim()].length>=min&&[...x.trim()].length<=max&&!/[\u0000-\u001f\u007f]/.test(x);
 if(!validText(w.name,2,48)||!validText(w.description,20,480)||!validText(w.bridge,15,240)||w.features.length!==3||new Set(w.features).size!==3||!w.features.every((f:any)=>validText(f,3,100)))throw new Error('READBACK BLOCKED: 真实 AI 输出格式错误。');
 return {work:w,lineage,parents,recomputedParentHashes:hashes,recomputedInputHash:inputHash,sourceSha:SOURCE_SHA,semanticStatus:'AWAITING HUMAN EVIDENCE REVIEW'};
}
