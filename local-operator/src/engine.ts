import {CHAIN,CHAIN_HEX,SOURCE_SHA,SEEDS,isAddress,isHash,same,stringify,type Step} from './config';
import {Store,assertStage,nextStep,type State,type Plan,type Entry,type Tx} from './store';
import {construct,sourceCheck,read,decodedTransaction,sha,plannedCalldata} from './sdk';
import {readiness,verifyBoundary,rpc,quantity} from './rpc';
import {walletState,type Provider} from './wallet';
import {verifySeed,verifyFusion,parsed,canonical} from './verify';
const defaults={construct,sourceCheck,read,decodedTransaction,readiness,verifyBoundary,rpc};
export type Services=typeof defaults;
export class Operator{
 constructor(public store:Store,private services:Services=defaults){}
 async prepare(p:Provider,step:Step):Promise<Plan>{
  const s=this.store.load();const w=await walletState(p);assertStage(s,step,w.account);
  try{
   const requestId=crypto.randomUUID();const built=await this.services.construct(s,step,w.account,requestId);
   const check=await this.services.verifyBoundary(p,built.tx,w.account);
   const current=await walletState(p);if(!same(current.account,w.account))throw new Error('SIGNING BLOCKED: 准备期间账户改变。');
   return {step,account:w.account,requestId,args:built.args,contract:s.contract,tx:{...built.tx,gas:check.gas,gasPrice:'0x0',value:'0x0',nonce:check.nonce,chainId:CHAIN_HEX,type:'0x0'},balance:check.ready.balance,estimatedFee:'0',preparedAt:new Date().toISOString(),sourceSha:SOURCE_SHA};
  }catch(e){this.store.stop(errorText(e));throw e;}
 }
 async submit(p:Provider,plan:Plan):Promise<string>{
  let s=this.store.load();assertStage(s,plan.step,plan.account);
  try{
   if(Date.now()-Date.parse(plan.preparedAt)>60000)throw new Error('SIGNING BLOCKED: 预检已超过 60 秒，请停止并只读调查。');
   await this.services.sourceCheck();
   // Reconstruct from stored real IDs and immutable inputs. No arbitrary calldata enters the wallet.
   const built=await this.services.construct(s,plan.step,plan.account,plan.requestId);
   for(const key of ['from','to','data','value','chainId'] as const)if(!same(built.tx[key],plan.tx[key]))throw new Error('SIGNING BLOCKED: 交易参数在预检后改变。');
   if(canonical(built.args)!==canonical(plan.args)||plan.sourceSha!==SOURCE_SHA||plan.contract!==s.contract)throw new Error('SIGNING BLOCKED: 参数来源不符。');
   const check=await this.services.verifyBoundary(p,plan.tx,plan.account);
   if(quantity(check.nonce,'nonce')!==quantity(plan.tx.nonce,'planned nonce'))throw new Error('SIGNING BLOCKED: nonce 已改变。');
   const tx:Tx={...plan.tx,gas:check.gas,gasPrice:'0x0',value:'0x0',chainId:CHAIN_HEX};
   // Re-read after async work; the Web Lock is held by the UI for this entire call.
   s=this.store.load();assertStage(s,plan.step,plan.account);
   const current=await walletState(p);if(!same(current.account,plan.account))throw new Error('SIGNING BLOCKED: 签名前账户改变。');
   const entry:Entry={plan:{...plan,tx},status:'INTENT',createdAt:new Date().toISOString()};
   if(plan.step==='T01')s.walletA=plan.account;
   if(plan.step==='T03')s.walletB=plan.account;
   s.entries[plan.step]=entry;this.store.save(s); // Must succeed BEFORE the only signing request.
   let hash:unknown;
   try{hash=await p.request({method:'eth_sendTransaction',params:[tx]});}
   catch(e){entry.status=Number((e as any)?.code)===4001?'FAILED':'UNKNOWN';entry.error=errorText(e);s.halt=entry.status==='FAILED'?'SIGNING BLOCKED: 用户拒签；本轮停止，禁止重试。':'SIGNING BLOCKED: 广播状态未知；只读调查钱包历史。';this.store.save(s);throw e;}
   if(!isHash(hash)){entry.status='UNKNOWN';s.halt='SIGNING BLOCKED: 钱包未返回有效 Hash。禁止重发。';this.store.save(s);throw new Error(s.halt);}
   entry.hash=hash;entry.status='SUBMITTED';
   // If storage fails, the caller still gets the returned hash in the error text.
   try{this.store.save(s);}catch{throw new Error('STORAGE BLOCKED: 已返回 Hash 但无法保存。立即复制并导出：'+hash+'；禁止重发。');}
   return hash;
  }catch(e){try{this.store.stop(errorText(e));}catch{/* Persistent intent already protects recovery if post-send storage fails. */}throw e;}
 }
 async recheck(step:Step):Promise<'PENDING'|'VERIFIED'>{
  let s=this.store.load();const e=s.entries[step];if(!e?.hash)throw new Error('READBACK BLOCKED: 没有 Hash；从钱包历史找到后使用“补录 Hash（只读）”。');
  try{
   const raw=await this.services.rpc('eth_getTransactionByHash',[e.hash]);if(!raw)throw new Error('RPC UNKNOWN: 已保存 Hash 暂无交易返回；禁止新写入。');
   e.raw=raw;this.store.save(s); // Always preserve actual response before interpretation.
   const envelope=plannedCalldata(e.plan.tx);
   if(raw.data?.calldata!==envelope.calldata||BigInt(raw.nonce??'-1')!==BigInt(e.plan.tx.nonce)||!same(envelope.sender,e.plan.account))throw new Error('READBACK BLOCKED: 交易 nonce 或真实 calldata 与保存 intent 不符。');
   if(!same(raw.hash,e.hash)||!same(raw.from_address??raw.from??raw.sender,e.plan.account)||BigInt(raw.value??'-1')!==0n||raw.leader_only!==false||raw.execution_mode==='LEADER_ONLY')throw new Error('READBACK BLOCKED: 交易身份、金额或共识模式不符。');
   const status=String(raw.statusName??raw.status).toUpperCase();
   if(['UNDETERMINED','CANCELED','VALIDATORS_TIMEOUT','LEADER_TIMEOUT'].includes(status))throw new Error('CONSENSUS FAILED: '+status);
   if(status!=='FINALIZED'&&status!=='7'){
    if(!['PENDING','ACTIVATED','PROPOSING','COMMITTING','REVEALING','ACCEPTED','AWAITING_FINALIZATION','0','1','2','3','4','5','6'].includes(status))throw new Error('RPC UNKNOWN: 无法识别状态 '+status);
    return 'PENDING';
   }
   // Stable field names are retained verbatim. No inference from absent votes or UI animation.
   const result=raw.resultName??raw.result_name??raw.result;
   const receipts=raw.consensus_data?.leader_receipt;const leader=Array.isArray(receipts)?receipts[0]:receipts;
   const execution=raw.txExecutionResultName??raw.tx_execution_result_name??raw.txExecutionResult??leader?.execution_result;
   if(!['MAJORITY_AGREE',6,'6'].includes(result)||!['FINISHED_WITH_RETURN',1,'1','SUCCESS'].includes(execution)||leader?.execution_result==='ERROR')throw new Error('CONSENSUS FAILED/UNKNOWN: 未同时证明共识接受与执行成功。');
   e.decoded=await this.services.decodedTransaction(e.hash);this.store.save(s);
   const receipt=await this.services.rpc('eth_getTransactionReceipt',[e.hash]);
   if(!receipt||!same(receipt.transactionHash,e.hash))throw new Error('READBACK BLOCKED: Gas 回执缺失。');
   const gasUsed=quantity(receipt.gasUsed,'actual gasUsed'),price=quantity(receipt.effectiveGasPrice,'actual gasPrice');
   e.actualFee={receipt,gasUsed:gasUsed.toString(),effectiveGasPrice:price.toString(),networkFee:(gasUsed*price).toString(),reportedFees:raw.fees??null};this.store.save(s);
   if(gasUsed*price!==0n||BigInt(raw.fees?.deposit??0)!==0n||BigInt(raw.fees?.userValue??0)!==0n)throw new Error('STOP: 实际费用或金额非零。');
   if(step==='T01'){
    const addr=raw.to_address??raw.recipient??receipt.contractAddress;
    if(!isAddress(addr)||same(addr,e.plan.tx.to))throw new Error('READBACK BLOCKED: 未取得真实 SPLICE 部署地址。');
    if(raw.recipient&& !same(raw.recipient,addr))throw new Error('READBACK BLOCKED: 地址返回冲突。');
    const code=raw.data?.contract_code;if(typeof code!=='string')throw new Error('READBACK BLOCKED: 缺少链上部署源码，无法核对。');
    const bytes=Uint8Array.from(atob(code),c=>c.charCodeAt(0));if(await sha(bytes)!==SOURCE_SHA)throw new Error('READBACK BLOCKED: 链上部署源码不符。');
    const total=await this.services.read(addr,'total');const initialVerified=e.status==='VERIFIED'&&Number(e.reads?.total)===0;
    if(!initialVerified&&Number(total)!==0)throw new Error('READBACK BLOCKED: 初始 total() 不为 0。');
    if(receipt.contractAddress&&!same(receipt.contractAddress,addr))throw new Error('READBACK BLOCKED: 回执地址冲突。');
    s.contract=addr;e.reads={sourceSha:SOURCE_SHA,contract:addr,total:initialVerified?e.reads.total:total,currentTotal:total};
   }else{
    const contract=s.contract!;if(!same(raw.to_address??raw.recipient,contract))throw new Error('READBACK BLOCKED: 交易目标不是已验证合约。');
    const request=await this.services.read(contract,'get_request',[e.plan.account,e.plan.requestId]);const id=Number(request);
    if(!Number.isSafeInteger(id)||id<1)throw new Error('READBACK BLOCKED: get_request 未返回实际作品 ID。');
    const work=await this.services.read(contract,'get_work',[id]);
    if(step==='T04'){
     const lineage=await this.services.read(contract,'get_lineage',[id]);e.reads={request,...await verifyFusion(s,work,lineage,id)};
     const total=await this.services.read(contract,'total');const list=parsed(await this.services.read(contract,'list_works',[1,30]));
     if(Number(total)!==3||!Array.isArray(list)||list.length!==3||!list.some((x:any)=>canonical(x)===canonical(e.reads.work)))throw new Error('READBACK BLOCKED: total / list_works 与受控的三件作品不一致。');
     e.reads.total=total;e.reads.list=list;
    }else e.reads={request,work:await verifySeed(work,e,id)};
   }
   e.status='VERIFIED';e.error=undefined;
   // A known, previously submitted hash can recover from read-only failures only.
   // Failed/rejected signing attempts and unknown broadcasts without a hash cannot unlock via another send.
   if(s.halt?.startsWith('READ-ONLY HOLD:'))delete s.halt;
   this.store.save(s);return 'VERIFIED';
  }catch(error){e.error=errorText(error);if(e.error.startsWith('CONSENSUS FAILED:')||e.error.startsWith('CONSENSUS FAILED/UNKNOWN:')||e.error.startsWith('STOP:')){e.status='FAILED';s.halt='STOP: '+e.error;}else s.halt=s.halt?.startsWith('STOP:')?s.halt:'READ-ONLY HOLD: '+e.error;this.store.save(s);throw error;}
 }
 recoverHash(step:Step,hash:string){
  const s=this.store.load(),e=s.entries[step];
  if(!e||e.hash||!['INTENT','UNKNOWN'].includes(e.status)||!isHash(hash))throw new Error('只允许为无 Hash 的已保存 intent 补录有效 Hash。');
  e.hash=hash;e.status='SUBMITTED';s.halt='READ-ONLY HOLD: 补录 Hash 后必须只读核验全部身份与参数。';this.store.save(s);
 }
 semantic(evidenceA:string,evidenceB:string,interaction:string,reviewed=false){
  const s=this.store.load();if(s.halt||s.entries.T04?.status!=='VERIFIED')throw new Error('真实融合及谱系尚未验证。');
  const work=s.entries.T04.reads.work,text=work.description+'\n'+work.features.join('\n');
  if(!reviewed&&[evidenceA,evidenceB,interaction].some(x=>x.trim().length<3||!text.includes(x.trim())))throw new Error('请分别从真实描述或特征中选取至少 3 字的原文证据。');
  if(reviewed&&[evidenceA,evidenceB,interaction].some(x=>x.trim()&&!text.includes(x.trim())))throw new Error('可选证据必须来自实际描述或特征。');
  s.semantic={mode:reviewed?'HUMAN_CONFIRMED_VISIBLE_COMPARISON':'HUMAN_EXCERPT_REVIEW',evidenceA:evidenceA.trim()||'Human confirmed displayed real output preserves a core source A feature.',evidenceB:evidenceB.trim()||'Human confirmed displayed real output preserves a core source B feature.',interaction:interaction.trim()||'Human confirmed displayed real output contains an integrated mechanism.',checkedAt:new Date().toISOString()};this.store.save(s);
 }
}
export const errorText=(e:unknown):string=>e instanceof Error?e.message:typeof (e as any)?.message==='string'?(e as any).message:(stringify(e)??String(e));
