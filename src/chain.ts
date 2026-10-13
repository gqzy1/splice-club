import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import type {TransactionHash,CalldataEncodable} from 'genlayer-js/types';
import {TransactionHashVariant} from 'genlayer-js/types';
import {DEPLOYMENT,NETWORK} from './config';
import {lifecycle,parseWork} from './domain';
import type {Work,Lineage,Progress,SeedInput} from './types';
export type WalletProvider={request:(args:{method:string;params?:unknown[]|object})=>Promise<any>;on?:(event:string,fn:(...args:unknown[])=>void)=>void;removeListener?:(event:string,fn:(...args:unknown[])=>void)=>void};
declare global {interface Window {ethereum?:WalletProvider}}
export const publicClient=createClient({chain:studionet,endpoint:NETWORK.rpc});
function address(){if(!DEPLOYMENT.address)throw new Error('The club is not deployed yet. Real creation opens after deployment.');return DEPLOYMENT.address;}
export async function gallery(start=1):Promise<Work[]>{
 const raw=await publicClient.readContract({address:address(),transactionHashVariant:TransactionHashVariant.LATEST_FINAL,functionName:'list_works',args:[start,30]});
 const values=typeof raw==='string'?JSON.parse(raw):raw;
 if(!Array.isArray(values))throw new Error('Invalid gallery response.');return values.map(parseWork);
}
export async function lineage(id:number):Promise<Lineage>{
 const raw=await publicClient.readContract({address:address(),transactionHashVariant:TransactionHashVariant.LATEST_FINAL,functionName:'get_lineage',args:[id]});
 const x=typeof raw==='string'?JSON.parse(raw):raw as unknown as Lineage;
 const work=parseWork(x.work),parents=x.parents.map(parseWork);
 if(parents.length!==work.parents.length||parents.some((p:Work,i:number)=>p.id!==work.parents[i]||p.creator!==work.parent_creators[i]))throw new Error('Lineage mismatch.');return {work,parents};
}
export async function connect():Promise<{account:`0x${string}`;provider:WalletProvider}>{
 const provider=window.ethereum;if(!provider)throw new Error('Install an EIP-1193 browser wallet to create.');
 const accounts=await provider.request({method:'eth_requestAccounts'}) as string[];
 if(!accounts[0]||!/^0x[0-9a-f]{40}$/i.test(accounts[0]))throw new Error('No wallet account available.');
 const chainId='0x'+NETWORK.id.toString(16);
 try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId}]});}
 catch(e){if((e as {code?:number}).code!==4902)throw e;await provider.request({method:'wallet_addEthereumChain',params:[{chainId,chainName:'GenLayer Studionet',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},rpcUrls:[NETWORK.rpc]}]});await provider.request({method:'wallet_switchEthereumChain',params:[{chainId}]});}
 if(Number(await provider.request({method:'eth_chainId'}))!==NETWORK.id)throw new Error('Switch to Stable Studionet (61999).');
 return {account:accounts[0] as `0x${string}`,provider};
}
export type Pending={account:`0x${string}`;requestId:string;hash:TransactionHash;kind:'seed'|'fusion';parents?:number[];contract?:string;chainId?:number};
const pendingKey='splice.pending.v1';
export function pending():Pending|null{try{const p=JSON.parse(localStorage.getItem(pendingKey)||'null');return p&&/^0x[0-9a-f]{64}$/i.test(p.hash)&&/^0x[0-9a-f]{40}$/i.test(p.account)?p:null;}catch{return null;}}
const intentKey='splice.submission-intent.v1';
export function unresolvedSubmission(){try{return localStorage.getItem(intentKey)!==null;}catch{return true;}}
// Protect the actual wallet boundary, including SDK ABI fallback and uncertain RPC outcomes.
export function guardedProvider(wallet:{account:`0x${string}`;provider:WalletProvider},intent:{requestId:string;kind:'seed'|'fusion';parents?:number[]}):WalletProvider{
 let attempted=false;
 return {request:async args=>{
  if(args.method!=='eth_sendTransaction')return wallet.provider.request(args);
  if(attempted)throw new Error('Submission already attempted. Check wallet history; no automatic resend.');
  if(Number(await wallet.provider.request({method:'eth_chainId'}))!==NETWORK.id)throw new Error('Wallet network changed before signing.');
  const accounts=await wallet.provider.request({method:'eth_accounts'}) as string[];
  if(accounts[0]?.toLowerCase()!==wallet.account.toLowerCase())throw new Error('Wallet account changed before signing.');
  const tx=(args.params as any[])?.[0];
  const gas=await publicClient.estimateTransactionGas({from:wallet.account,to:tx.to,data:tx.data,value:BigInt(tx.value||'0x0')});
  const price=await publicClient.request({method:'eth_gasPrice'});
  if(BigInt(price as string)!==0n||BigInt(tx.value||'0x0')!==0n)throw new Error('Nonzero fee/value requires a new budget decision. Signing stopped.');
  attempted=true;
  localStorage.setItem(intentKey,JSON.stringify({...intent,account:wallet.account,contract:address(),chainId:NETWORK.id,createdAt:new Date().toISOString()}));
  try{
   const hash=await wallet.provider.request({...args,params:[{...tx,gas:'0x'+gas.toString(16),gasPrice:'0x0'}]});
   if(typeof hash!=='string'||!/^0x[0-9a-f]{64}$/i.test(hash))throw new Error('No hash returned; inspect wallet history before any retry.');
   localStorage.setItem(pendingKey,JSON.stringify({...intent,account:wallet.account,hash,contract:address(),chainId:NETWORK.id}));
   localStorage.removeItem(intentKey);return hash;
  }catch(e){if((e as {code?:number}).code===4001)localStorage.removeItem(intentKey);throw e;}
 }};
}
let busy=false;
export function isBusy(){return busy;}
export async function track(p:Pending,update:(p:Progress)=>void):Promise<Work>{
 if((p.contract&&p.contract.toLowerCase()!==address().toLowerCase())||(p.chainId&&p.chainId!==NETWORK.id))throw new Error('Saved transaction belongs to a different deployment. Inspect its original network and contract.');
 // Never resubmit automatically. A timeout retains the hash for explicit read-only recheck.
 for(let i=0;i<120;i++){
  const state=lifecycle(await publicClient.getTransaction({hash:p.hash}));update({...state,hash:p.hash,requestId:p.requestId});
  if(state.phase==='failed'||state.phase==='rejected'){localStorage.removeItem(pendingKey);throw new Error(state.label);}
  if(state.phase==='finalized'){
   const id=Number(await publicClient.readContract({address:address(),transactionHashVariant:TransactionHashVariant.LATEST_FINAL,functionName:'get_request',args:[p.account,p.requestId]}));
   if(!Number.isSafeInteger(id)||id<1)throw new Error('Finalized but saved work could not be verified. Recheck the same hash.');
   const raw=await publicClient.readContract({address:address(),transactionHashVariant:TransactionHashVariant.LATEST_FINAL,functionName:'get_work',args:[id]});const work=parseWork(raw);
   if(work.creator.toLowerCase()!==p.account.toLowerCase()||work.kind!==p.kind||(p.parents&&work.parents.join(',')!==p.parents.join(',')))throw new Error('Saved work does not match this request.');
   localStorage.removeItem(pendingKey);update({phase:'success',label:'Saved onchain. Meet your new creation.',hash:p.hash,requestId:p.requestId});return work;
  }
  await new Promise(r=>setTimeout(r,2500));
 }
 throw new Error('Still waiting. Recheck this transaction; do not submit it again.');
}
export async function write(wallet:{account:`0x${string}`;provider:WalletProvider},kind:'seed'|'fusion',input:SeedInput|Work[],update:(p:Progress)=>void):Promise<Work>{
 if(busy||pending()||unresolvedSubmission())throw new Error('A transaction is already waiting. Recheck it first.');busy=true;
 try{
  const contract=address();if(Number(await wallet.provider.request({method:'eth_chainId'}))!==NETWORK.id)throw new Error('Wallet network changed. Reconnect to Studionet.');
  const accounts=await wallet.provider.request({method:'eth_accounts'}) as string[];
  if(accounts[0]?.toLowerCase()!==wallet.account.toLowerCase())throw new Error('Wallet account changed. Reconnect.');
  const requestId=crypto.randomUUID();const args:CalldataEncodable[]=kind==='seed'?[(input as SeedInput).name,(input as SeedInput).description,(input as SeedInput).features,(input as SeedInput).category,(input as SeedInput).allow,requestId]:[(input as Work[])[0].id,(input as Work[])[1].id,requestId];
  // Fail before signing if interrupted-transaction recovery cannot be persisted.
  try{localStorage.setItem('splice.storage-check','ok');localStorage.removeItem('splice.storage-check');}catch{throw new Error('Enable browser storage before submitting, so a pending transaction can be recovered.');}
  update({phase:'signing',label:'Confirm in your wallet. All content is public.',requestId});
  const client=createClient({chain:studionet,endpoint:NETWORK.rpc,account:wallet.account,provider:guardedProvider(wallet,{requestId,kind,parents:kind==='fusion'?(input as Work[]).map(w=>w.id).sort((a,b)=>a-b):undefined})});
  const hash=await client.writeContract({address:contract,functionName:kind==='seed'?'create_seed':'fuse',args,value:0n,leaderOnly:false});
  if(typeof hash!=='string'||!/^0x[0-9a-f]{64}$/i.test(hash))throw new Error('Wallet did not return a transaction hash.');
  const p:Pending={account:wallet.account,requestId,contract,chainId:NETWORK.id,hash:hash as TransactionHash,kind,parents:kind==='fusion'?(input as Work[]).map(w=>w.id).sort((a,b)=>a-b):undefined};
  localStorage.setItem(pendingKey,JSON.stringify(p));update({phase:'submitted',label:'Submitted. The network is working on it.',hash,requestId});return await track(p,update);
 }finally{busy=false;}
}
export function walletError(e:unknown){return (e as {code?:number})?.code===4001?'Wallet request declined.':e instanceof Error?e.message:'Wallet or network error. Please retry reads.';}
