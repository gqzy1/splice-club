import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import type {TransactionHash} from 'genlayer-js/types';
import {decodeFunctionData,fromRlp} from 'viem';
import source from '../contracts/creative_fusion.py?raw';
import {SOURCE_SHA,RPC,SEEDS,isAddress,same,type Step} from './config';
import type {State,Tx} from './store';
import type {Provider} from './wallet';
export const client=createClient({chain:studionet,endpoint:RPC});
export async function sha(bytes:Uint8Array){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function sourceCheck(){const digest=await sha(new TextEncoder().encode(source));if(digest!==SOURCE_SHA)throw new Error('STOP: 官方源码 SHA256 不符。');return digest;}
export function callArgs(s:State,step:Step,rid:string):any[]{
 if(step==='T01')return [];
 if(step==='T02'||step==='T03'){const v=SEEDS[step];return [v.name,v.description,[...v.features],v.category,true,rid];}
 const a=s.entries.T02?.reads?.work?.id,b=s.entries.T03?.reads?.work?.id;
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<1||b<1||a===b)throw new Error('STOP: 缺少两个已经读回验证的真实 ID。');return [a,b,rid];
}
export async function timeout<T>(promise:Promise<T>,ms=20000):Promise<T>{let timer:ReturnType<typeof setTimeout>;try{return await Promise.race([promise,new Promise<T>((_,reject)=>{timer=setTimeout(()=>reject(new Error('RPC BLOCKED: SDK 只读操作超时。')),ms);})]);}finally{clearTimeout(timer!);}}
// The SDK NEVER receives the real signing provider. Its outgoing send is captured,
// then rejected, with no hash or successful response fabricated. Its fallback stays isolated.
export async function construct(s:State,step:Step,account:`0x${string}`,rid:string):Promise<{tx:Tx;args:any[]}>{
 await sourceCheck();const args=callArgs(s,step,rid);let captured:any;let count=0;
 const capture:Provider={request:async request=>{if(request.method==='eth_sendTransaction'){count++;if(count===1)captured=request.params?.[0];throw new Error('OPERATOR_BUILD_ONLY_CAPTURED');}throw new Error('OPERATOR_BUILD_ONLY_FORBIDDEN_METHOD');}};
 const sdk=createClient({chain:studionet,endpoint:RPC,account,provider:capture});
 try{if(step==='T01')await timeout(sdk.deployContract({code:new TextEncoder().encode(source),args:[],leaderOnly:false}));
 else{if(!isAddress(s.contract))throw new Error('No real contract address');await timeout(sdk.writeContract({address:s.contract,functionName:step==='T04'?'fuse':'create_seed',args,value:0n,leaderOnly:false}));}}catch{/* Intentional SDK interruption. A valid captured request is required below. */}
 if(count!==1||!captured)throw new Error('RPC UNSUPPORTED: SDK 未能构造单一请求；禁止签名。');
 if(!same(captured.from,account)||!same(captured.to,studionet.consensusMainContract?.address)||captured.value!=='0x0'||Number(captured.chainId)!==61999||!/^0x[0-9a-f]+$/i.test(captured.data))throw new Error('SIGNING BLOCKED: SDK 构造结果异常。');
 return {tx:captured as Tx,args};
}
export async function read(contract:`0x${string}`,fn:string,args:any[]=[]){return timeout(client.readContract({address:contract,transactionHashVariant:TransactionHashVariant.LATEST_FINAL,functionName:fn,args}));}
export async function decodedTransaction(hash:`0x${string}`){return timeout(client.getTransaction({hash:hash as TransactionHash}));}

export function plannedCalldata(tx:Tx){
 const decoded=decodeFunctionData({abi:studionet.consensusMainContract!.abi,data:tx.data});
 if(decoded.functionName!=='addTransaction'||!decoded.args)throw new Error('Unrecognized SDK envelope');
 const args=decoded.args as readonly any[];const parts=fromRlp(args[4] as `0x${string}`) as string[];
 if(parts[parts.length-1]!=='0x'&&parts[parts.length-1]!=='0x00')throw new Error('leaderOnly must be false');
 const call=parts.length===3?parts[1]:parts[0];
 const bytes=Uint8Array.from(call.slice(2).match(/.{2}/g)??[],h=>parseInt(h,16));
 return {calldata:btoa(String.fromCharCode(...bytes)),recipient:args[1],sender:args[0]};
}
