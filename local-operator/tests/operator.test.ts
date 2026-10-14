// ALL addresses, hashes and outputs in this file are synthetic MOCK fixtures.
// This directory is excluded from the runtime bundle. It is never onchain evidence.
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {webcrypto} from 'node:crypto';
import {decodeFunctionData,fromRlp,fromHex} from 'viem';
import {abi} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {CHAIN,CHAIN_HEX,SOURCE_SHA,SEEDS,isAddress,stringify,type Step} from '../src/config';
import {choice,connect,discover,walletState,configure,type Provider} from '../src/wallet';
import {Store,fresh,assertStage,evidence,exclusive,KEY,type Plan,type State,type Entry} from '../src/store';
import {construct,sourceCheck,plannedCalldata} from '../src/sdk';
import {readiness,verifyBoundary,rpc} from '../src/rpc';
import {Operator,type Services} from '../src/engine';
import {digest,canonical,verifyFusion} from '../src/verify';
const A=('0x'+'a'.repeat(40)) as `0x${string}`,B=('0x'+'b'.repeat(40)) as `0x${string}`,CONTRACT=('0x'+'c'.repeat(40)) as `0x${string}`,HASH=('0x'+'d'.repeat(64)) as `0x${string}`;
let selected=A,sent=0,price='0x0',gasFail=false,rejected=false,noHash=false,rpcError=false,raw:any,works:Record<number,any>,lineage:any;
const provider:Provider={isOkxWallet:true,request:vi.fn(async({method}:any)=>{
 if(method==='eth_requestAccounts'||method==='eth_accounts')return [selected];
 if(method==='eth_chainId')return CHAIN_HEX;
 if(method==='eth_getBalance')return '0x100';
 if(method==='eth_gasPrice')return price;
 if(method==='eth_estimateGas'){if(gasFail)throw new Error('estimate error');return '0x5208';}
 if(method==='eth_sendTransaction'){sent++;if(rejected)throw Object.assign(new Error('declined'),{code:4001});return noHash?null:HASH;}
 throw new Error('Unexpected method '+method);
})};
function response(result:any){return {ok:true,status:200,json:async()=>({jsonrpc:'2.0',id:1,result})} as Response;}
function mockFetch(){vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{
 const {method}=JSON.parse(init.body as string);
 if(rpcError)throw new TypeError('mock network failure');
 if(method==='eth_chainId')return response(CHAIN_HEX);
 if(method==='eth_gasPrice')return response(price);
 if(method==='eth_getBalance')return response('0x100');
 if(method==='eth_getTransactionCount')return response('0x0');
 if(method==='eth_estimateGas'){if(gasFail)return {ok:true,json:async()=>({error:{code:-32000,message:'estimate failed'}})} as Response;return response('0x5208');}
 throw new Error('Unexpected mock RPC '+method);
}));}
function services():Services{return {construct,sourceCheck,readiness,verifyBoundary,rpc:vi.fn(async(method)=>{
 if(method==='eth_getTransactionByHash'){if(rpcError)throw new Error('RPC UNKNOWN');return raw;}
 if(method==='eth_getTransactionReceipt')return {transactionHash:HASH,gasUsed:'0x5208',effectiveGasPrice:'0x0'};
 throw new Error('Unexpected service RPC');
}),read:vi.fn(async(_contract,fn,args)=>{
 if(fn==='total')return 0;
 if(fn==='get_request')return 11;
 if(fn==='get_work')return stringify(works[Number(args?.[0])]);
 if(fn==='get_lineage')return stringify(lineage);
 throw new Error('Unexpected read '+fn);
}),decodedTransaction:vi.fn(async()=>({...raw,statusName:raw?.status}))} as unknown as Services;}
async function planFor(s:State= fresh(),step:Step='T01',account=A):Promise<Plan>{const built=await construct(s,step,account,crypto.randomUUID());return {step,account,requestId:step==='T01'?'unused-deploy-id':crypto.randomUUID(),args:built.args,contract:s.contract,tx:{...built.tx,gas:'0x5208',gasPrice:'0x0'},balance:'0x100',estimatedFee:'0',sourceSha:SOURCE_SHA,preparedAt:new Date().toISOString()};}
async function prepared(store=new Store(),svc=services()){const op=new Operator(store,svc);return {op,store,svc,plan:await op.prepare(provider,'T01')};}
async function setRaw(plan:Plan){raw={hash:HASH,from_address:plan.account,to_address:CONTRACT,recipient:CONTRACT,nonce:0,value:0,leader_only:false,execution_mode:'NORMAL',status:'FINALIZED',result_name:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN',data:{contract_code:btoa(await (await import('../contracts/creative_fusion.py?raw')).default),calldata:plannedCalldata(plan.tx).calldata}};}
async function seed(id:number,creator:string,step:'T02'|'T03'){
 const v=SEEDS[step],payload={kind:'seed',name:v.name,description:v.description,features:[...v.features],category:v.category,parents:[],parent_creators:[],depth:0};return {...payload,id,creator,version:'SPLICE-V1',license:'PUBLIC-DERIVATION-V1',request_fingerprint:await digest(payload)};
}
async function stateThroughSeed(){const s=fresh();s.walletA=A;s.walletB=B;s.contract=CONTRACT;
 for(const step of ['T01','T02','T03'] as Step[]){const plan=await planFor(s,step,step==='T03'?B:A);const w=step==='T02'?await seed(11,A,'T02'):step==='T03'?await seed(27,B,'T03'):undefined;s.entries[step]={plan,status:'VERIFIED',hash:HASH,createdAt:new Date().toISOString(),raw:{mock:true},reads:{work:w}};}
 return s;}
beforeEach(()=>{localStorage.clear();selected=A;sent=0;price='0x0';gasFail=false;rejected=false;noHash=false;rpcError=false;raw=null;works={};lineage=null;vi.clearAllMocks();Object.defineProperty(globalThis.crypto,'subtle',{value:webcrypto.subtle,configurable:true});mockFetch();vi.spyOn(console,'warn').mockImplementation(()=>{});vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('explicit OKX discovery and A/B flow (MOCK)',()=>{
 it('recognizes only OKX RDNS and never selects MetaMask based on window.ethereum',()=>{expect(choice({info:{uuid:'mm',name:'MetaMask',rdns:'io.metamask'},provider})?.okx).toBe(false);expect(choice({info:{uuid:'okx',name:'OKX Wallet',rdns:'com.okex.wallet'},provider})?.okx).toBe(true);});
 it('ignores malformed announcements',()=>{expect(choice({provider:{}})).toBeNull();});
 it('discovers multiple providers, preserves selection to UI and authorizes none',()=>{const found:any[]=[];(window as any).ethereum=provider;(window as any).okxwallet=provider;const stop=discover(cs=>found.push(cs));window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'mm',name:'MetaMask',rdns:'io.metamask'},provider:{request:vi.fn()}}}));expect(found.at(-1)).toHaveLength(2);expect(sent).toBe(0);expect(provider.request).not.toHaveBeenCalled();stop();delete (window as any).ethereum;delete (window as any).okxwallet;});
 it('refuses connect to non OKX choice',async()=>{await expect(connect({id:'mm',name:'MetaMask',rdns:'io.metamask',provider,okx:false})).rejects.toThrow('OKX');});
 it('requests authorization only by explicit connect',async()=>{const c={id:'okx',name:'OKX',rdns:'com.okex.wallet',provider,okx:true};expect((await connect(c)).account).toBe(A);expect(sent).toBe(0);});
 it('adds fixed Stable network only after 4902',async()=>{const p={request:vi.fn().mockRejectedValueOnce({code:4902}).mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(CHAIN_HEX).mockResolvedValueOnce([A])};await configure(p);expect(p.request.mock.calls[1][0].params[0]).toEqual({chainId:CHAIN_HEX,chainName:'GenLayer Studionet',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},rpcUrls:['https://studio.genlayer.com/api']});});
 it('does not add another network after arbitrary wallet errors',async()=>{const p={request:vi.fn().mockRejectedValue({code:4001})};await expect(configure(p)).rejects.toBeDefined();expect(p.request).toHaveBeenCalledTimes(1);});
 it('enforces A -> B -> original A and B != A',async()=>{const s=await stateThroughSeed();delete s.entries.T03;delete s.walletB;expect(()=>assertStage(s,'T03',A)).toThrow('SWITCH TO WALLET B');expect(()=>assertStage(s,'T03',B)).not.toThrow();s.entries.T03={...(s.entries.T02!),plan:{...s.entries.T02!.plan,step:'T03',account:B}};expect(()=>assertStage(s,'T04',B)).toThrow('SWITCH BACK');expect(()=>assertStage(s,'T04',A)).not.toThrow();});
 it('blocks wallet chain mismatch',async()=>{await expect(walletState({request:async({method})=>method==='eth_chainId'?'0x1':[A]})).rejects.toThrow('61999');});
});
describe('fixed SDK build and strict fees (MOCK)',()=>{
 it('verifies exact canonical source bytes',async()=>{expect(await sourceCheck()).toBe(SOURCE_SHA);});
 it('uses actual SDK deploy interface with zero recipient, no constructor args, false leaderOnly; no real provider send',async()=>{const p=await planFor();const d=decodeFunctionData({abi:studionet.consensusMainContract!.abi,data:p.tx.data});const args=d.args as readonly any[];expect(args[0].toLowerCase()).toBe(A);expect(args[1]).toBe('0x'+'0'.repeat(40));const parts=fromRlp(args[4]) as string[];expect(parts).toHaveLength(3);expect(fromHex(parts[0] as `0x${string}`,'string')).toContain('class CreativeFusion');const decoded=(abi as any).calldata.decode(fromHex(parts[1] as `0x${string}`,'bytes'));expect(decoded.args??[]).toEqual([]);expect(parts[2]).toBe('0x00');expect(sent).toBe(0);});
 it('generates exact T02 and T03 inputs and unique request IDs',async()=>{const s=await stateThroughSeed();for(const step of ['T02','T03'] as const){const id=crypto.randomUUID();const x=await construct(s,step,step==='T02'?A:B,id);const seed=SEEDS[step];expect(x.args).toEqual([seed.name,seed.description,[...seed.features],seed.category,true,id]);expect(id).toMatch(/^[a-z0-9-]{8,64}$/);}});
 it('uses actual verified IDs 11 and 27 in T04, never assumed 1 and 2',async()=>{const s=await stateThroughSeed();const x=await construct(s,'T04',A,'request-real-ids');expect(x.args).toEqual([11,27,'request-real-ids']);});
 it('fails before constructing fusion without real IDs',async()=>{await expect(construct(fresh(),'T04',A,'rid-real-ids')).rejects.toThrow('真实 ID');});
 it('checks both wallet and direct RPC, balance, fee, full estimate',async()=>{const p=await planFor();expect((await verifyBoundary(provider,p.tx,A)).gas).toBe('0x5208');expect(sent).toBe(0);expect((fetch as any).mock.calls.map((x:any)=>JSON.parse(x[1].body).method)).toContain('eth_estimateGas');});
 it('blocks estimate failures despite SDK default gas fallback',async()=>{gasFail=true;const store=new Store(),op=new Operator(store);await expect(op.prepare(provider,'T01')).rejects.toThrow();expect(store.load().halt).toBeTruthy();expect(sent).toBe(0);});
 it('blocks nonzero gas price before signing',async()=>{const p=await planFor();price='0x1';await expect(verifyBoundary(provider,p.tx,A)).rejects.toThrow('非零');expect(sent).toBe(0);});
 it('blocks nonzero value and wrong sender',async()=>{const p=await planFor();await expect(verifyBoundary(provider,{...p.tx,value:'0x1'},A)).rejects.toThrow('不匹配');await expect(verifyBoundary(provider,p.tx,B)).rejects.toThrow('不匹配');});
 it('reports HTTP 403 distinctly without fallback',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,status:403})));await expect(rpc('eth_chainId')).rejects.toThrow('403');});
 it('does not claim to distinguish CORS from transport failure',async()=>{rpcError=true;await expect(rpc('eth_chainId')).rejects.toThrow('CORS');});
 it('does not call banned or write RPC methods',async()=>{await expect(rpc('eth_sendTransaction')).rejects.toThrow('非只读');await expect(rpc('sim_getFeeConfig')).rejects.toThrow('非只读');});
});
describe('one send, persistence, fail closed, recovery (MOCK)',()=>{
 it('persists intent before send and Hash immediately after response',async()=>{const {op,store,plan}=await prepared();const original=provider.request;const p={request:async(r:any)=>{if(r.method==='eth_sendTransaction')expect(store.load().entries.T01?.status).toBe('INTENT');return original(r);}};await op.submit(p,plan);expect(store.load().entries.T01?.hash).toBe(HASH);expect(sent).toBe(1);});
 it('rejects all duplicate sends, including a new engine after page refresh',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);await expect(new Operator(new Store()).submit(provider,plan)).rejects.toThrow();expect(sent).toBe(1);expect(store.load().entries.T01?.status).toBe('SUBMITTED');});
 it('does not retry user rejection; workflow stops even with zero broadcasts',async()=>{const {op,store,plan}=await prepared();rejected=true;await expect(op.submit(provider,plan)).rejects.toThrow('declined');await expect(op.submit(provider,plan)).rejects.toThrow('STOP');expect(sent).toBe(1);expect(store.load().entries.T01?.status).toBe('FAILED');});
 it('no Hash response keeps UNKNOWN and blocks every new write',async()=>{const {op,store,plan}=await prepared();noHash=true;await expect(op.submit(provider,plan)).rejects.toThrow('Hash');expect(store.load().entries.T01?.status).toBe('UNKNOWN');await expect(op.submit(provider,plan)).rejects.toThrow('STOP');expect(sent).toBe(1);});
 it('detects account change before sending',async()=>{const {op,plan}=await prepared();selected=B;await expect(op.submit(provider,plan)).rejects.toThrow();expect(sent).toBe(0);});
 it('detects gas price change between prepare and send',async()=>{const {op,plan}=await prepared();price='0x1';await expect(op.submit(provider,plan)).rejects.toThrow();expect(sent).toBe(0);});
 it('detects tampered data',async()=>{const {op,plan}=await prepared();plan.tx.data='0x1234';await expect(op.submit(provider,plan)).rejects.toThrow('参数');expect(sent).toBe(0);});
 it('storage failure before signing prevents wallet call',async()=>{const {plan}=await prepared();const memory=new Map<string,string>();const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{if(v.includes('INTENT'))throw new Error('disk full');memory.set(k,v);}};await expect(new Operator(new Store(storage)).submit(provider,plan)).rejects.toThrow();expect(sent).toBe(0);});
 it('post-broadcast storage failure exposes Hash and leaves INTENT',async()=>{const memory=new Map<string,string>();const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{if(v.includes('SUBMITTED'))throw new Error('disk full');memory.set(k,v);}};const {op,store,plan}=await prepared(new Store(storage));await expect(op.submit(provider,plan)).rejects.toThrow(HASH);expect(store.load().entries.T01?.status).toBe('INTENT');expect(sent).toBe(1);});
 it('blocks corrupt saved state instead of silently starting over',()=>{localStorage.setItem(KEY,'{');expect(()=>new Store().load()).toThrow();localStorage.setItem(KEY,JSON.stringify({...fresh(),chainId:1}));expect(()=>new Store().load()).toThrow('网络');});
 it('read RPC error halts later writes and preserves Hash',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);rpcError=true;await expect(op.recheck('T01')).rejects.toThrow();expect(store.load().halt).toBeTruthy();expect(store.load().entries.T01?.hash).toBe(HASH);expect(sent).toBe(1);});
 it('pending is not verified and cannot unlock the next step',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);await setRaw(plan);raw.status='ACCEPTED';expect(await op.recheck('T01')).toBe('PENDING');expect(store.load().entries.T01?.status).toBe('SUBMITTED');expect(()=>assertStage(store.load(),'T02',A)).toThrow();});
 it('unknown status is a hold, never a successful readback',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);await setRaw(plan);raw.status='FUTURE_STATUS';await expect(op.recheck('T01')).rejects.toThrow('UNKNOWN');expect(store.load().entries.T01?.status).not.toBe('VERIFIED');});
 it('consensus failure is a permanent stop and no simulated creation is stored',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);await setRaw(plan);raw.result_name='MAJORITY_DISAGREE';await expect(op.recheck('T01')).rejects.toThrow('CONSENSUS');expect(store.load().entries.T01?.reads).toBeUndefined();expect(store.load().halt).toMatch(/^STOP:/);});
 it('finalized successful deploy verifies code, real address, zero total and actual fee',async()=>{const {op,store,plan}=await prepared();await op.submit(provider,plan);await setRaw(plan);expect(await op.recheck('T01')).toBe('VERIFIED');expect(store.load().contract).toBe(CONTRACT);expect(store.load().entries.T01?.actualFee.networkFee).toBe('0');expect(sent).toBe(1);});
 it('failed readback cannot mark deploy verified',async()=>{const svc=services();svc.read=vi.fn().mockRejectedValue(new Error('read failed'));const {op,store,plan}=await prepared(new Store(),svc);await op.submit(provider,plan);await setRaw(plan);await expect(op.recheck('T01')).rejects.toThrow('read failed');expect(store.load().entries.T01?.status).not.toBe('VERIFIED');});
 it('rejects a substituted Hash transaction with different nonce or calldata',async()=>{const {op,plan}=await prepared();await op.submit(provider,plan);await setRaw(plan);raw.nonce=1;await expect(op.recheck('T01')).rejects.toThrow('nonce');});
 it('can attach lost Hash to preserved intent without sending and then verify it',async()=>{const {op,store,plan}=await prepared();noHash=true;await expect(op.submit(provider,plan)).rejects.toThrow();op.recoverHash('T01',HASH);await setRaw(plan);await op.recheck('T01');expect(store.load().entries.T01?.status).toBe('VERIFIED');expect(sent).toBe(1);});
 it('requires Web Locks; a held lock blocks another tab',async()=>{Object.defineProperty(navigator,'locks',{value:{request:async(_name:any,_opts:any,fn:any)=>fn(null)},configurable:true});await expect(exclusive(async()=>{sent++;})).rejects.toThrow('另一标签');expect(sent).toBe(0);});
 it('redacts credential fields from unexpected raw RPC metadata',()=>{const s=fresh();s.diagnostic={node_config:{api_key:'SHOULD_NEVER_EXPORT',authorization:'BEARER_PRIVATE',privateKey:'SENSITIVE_TEST_VALUE'}};const out=JSON.stringify(evidence(s));expect(out).not.toMatch(/SHOULD_NEVER_EXPORT|BEARER_PRIVATE|SENSITIVE_TEST_VALUE/);expect(out).toContain('REDACTED_CREDENTIAL_FIELD');});
 it('export is NOT RUN for all unexecuted stages and never invents wallet records',()=>{const out=evidence(fresh());expect(Object.values(out.steps).every((x:any)=>x.status==='NOT RUN')).toBe(true);expect(out.walletA).toBe('NOT RUN');expect(out.status).toContain('NOT RUN LIVE');expect(JSON.stringify(out)).not.toMatch(/privateKey|mnemonic|password|seedPhrase/);});
});
describe('fusion verification (MOCK)',()=>{
 it('verifies complete sorted lineage and Unicode Python-compatible hashes, requires semantic evidence before final success',async()=>{
 const s=await stateThroughSeed(),parents=[s.entries.T02!.reads.work,s.entries.T03!.reads.work];
 const w={kind:'fusion',id:42,creator:A,version:'SPLICE-V1',license:'PUBLIC-DERIVATION-V1',name:'Mock prism loom',description:'Prismatic moonlight weaves tones into threads; antenna rhythm steers their release.',features:['prismatic shell refracts moonlight','weaves tones into threads','antenna rhythms steer light release'],bridge:'Rhythmic light activates the woven sound threads.',category:'wildcard',parents:[11,27],parent_creators:[A,B],depth:1,parent_hashes:await Promise.all(parents.map(digest)),input_hash:await digest({version:'SPLICE-V1',parents}),request_fingerprint:await digest({snapshot:canonical({version:'SPLICE-V1',parents})})};
 const result=await verifyFusion(s,w,{work:w,parents},42);expect(result.work.id).toBe(42);expect(canonical({z:'光😀',a:1})).toBe('{"a":1,"z":"\\u5149\\ud83d\\ude00"}');
 const plan=await planFor(s,'T04');s.entries.T04={plan,status:'VERIFIED',hash:HASH,createdAt:new Date().toISOString(),raw:{mock:true},reads:result};const store=new Store();store.save(s);expect(evidence(s).status).not.toContain('REAL ONCHAIN FUSION VERIFIED');
 const op=new Operator(store);expect(()=>op.semantic('fake','fake','fake')).toThrow();op.semantic('Prismatic moonlight','weaves tones','antenna rhythm steers');expect(evidence(store.load()).status).toBe('REAL ONCHAIN FUSION VERIFIED');
 await expect(verifyFusion(s,{...w,input_hash:'bad'},{work:w,parents},42)).rejects.toThrow('哈希');
 });
});
