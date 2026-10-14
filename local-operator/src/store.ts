import {BASE_COMMIT,CHAIN,SOURCE_SHA,STEPS,isAddress,isHash,stringify,type Step} from './config';
export type Tx={from:`0x${string}`;to:`0x${string}`;data:`0x${string}`;value:string;gas:string;gasPrice:string;nonce:string;chainId:string;type:string};
export type Plan={step:Step;account:`0x${string}`;requestId:string;args:any[];contract?:`0x${string}`;tx:Tx;balance:string;estimatedFee:string;preparedAt:string;sourceSha:string};
export type Entry={plan:Plan;status:'INTENT'|'SUBMITTED'|'VERIFIED'|'FAILED'|'UNKNOWN';hash?:`0x${string}`;createdAt:string;raw?:any;decoded?:any;reads?:any;actualFee?:any;error?:string};
export type State={version:1;chainId:61999;sourceSha:string;baseCommit:string;walletA?:`0x${string}`;walletB?:`0x${string}`;contract?:`0x${string}`;entries:Partial<Record<Step,Entry>>;halt?:string;semantic?:{mode?:string;evidenceA:string;evidenceB:string;interaction:string;checkedAt:string};diagnostic?:any};
export const KEY='splice.fast2c.operator.v1';
export const LOCK='splice.fast2c.operator.exclusive';
export const fresh=():State=>({version:1,chainId:CHAIN,sourceSha:SOURCE_SHA,baseCommit:BASE_COMMIT,entries:{}});
export function validateState(s:any):asserts s is State{
 if(!s||s.version!==1||s.chainId!==CHAIN||s.sourceSha!==SOURCE_SHA||!s.entries||typeof s.entries!=='object'||Array.isArray(s.entries))throw new Error('STORAGE BLOCKED: 保存记录损坏或网络不匹配。不得清除存储后重发。');
 for(const key of ['walletA','walletB','contract'])if(s[key]!==undefined&&!isAddress(s[key]))throw new Error('STORAGE BLOCKED: 无效地址。');
 for(const [k,e] of Object.entries(s.entries) as [Step,Entry][]){if(!STEPS.includes(k)||!e||!['INTENT','SUBMITTED','VERIFIED','FAILED','UNKNOWN'].includes(e.status)||e.plan?.step!==k||!isAddress(e.plan?.account)||e.plan?.sourceSha!==SOURCE_SHA||(e.hash!==undefined&&!isHash(e.hash)))throw new Error('STORAGE BLOCKED: 无效交易记录。');if(e.status==='VERIFIED'&&(!e.hash||!e.raw||!e.reads))throw new Error('STORAGE BLOCKED: 缺少验证证据。');}
}
export class Store{
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>=localStorage){}
 load():State{const raw=this.storage.getItem(KEY);if(raw===null){const s=fresh();this.save(s);return s;}const s=JSON.parse(raw);validateState(s);return s;}
 save(s:State){validateState(s);const data=stringify(s);this.storage.setItem(KEY,data);if(this.storage.getItem(KEY)!==data)throw new Error('STORAGE BLOCKED: 保存后复读不一致。');}
 stop(message:string){const s=this.load();s.halt=message;this.save(s);return s;}
}
export function nextStep(s:State):Step|null{return STEPS.find(k=>s.entries[k]?.status!=='VERIFIED')??null;}
export function assertStage(s:State,step:Step,account:string){
 if(s.halt)throw new Error('STOP: '+s.halt);
 if(Object.values(s.entries).length>=4||s.entries[step]||nextStep(s)!==step)throw new Error('STOP: 阶段已使用或顺序不正确，禁止重复提交。');
 if(step==='T01'){if(s.walletA&&!sameAddress(s.walletA,account))throw new Error('SWITCH BACK TO WALLET A');return;}
 if(!isAddress(s.contract)||!isAddress(s.walletA))throw new Error('STOP: 部署未验证。');
 if(step==='T03'){if(sameAddress(account,s.walletA))throw new Error('SWITCH TO WALLET B: B 必须不同于 A。');if(s.walletB&&!sameAddress(account,s.walletB))throw new Error('WALLET BLOCKED: B 地址改变。');}
 else if(!sameAddress(account,s.walletA))throw new Error('SWITCH BACK TO WALLET A');
}
const sameAddress=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export async function exclusive<T>(fn:()=>Promise<T>):Promise<T>{
 if(!navigator.locks)throw new Error('STORAGE BLOCKED: 此 Chrome 缺少 Web Locks，禁止写入。');
 return navigator.locks.request(LOCK,{mode:'exclusive',ifAvailable:true},lock=>{if(!lock)throw new Error('STOP: 另一标签页正在操作。');return fn();});
}
export function redact(value:any):any{
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/^(privatekey|mnemonic|seedphrase|password|walletpassword|apikey|authorization|accesstoken|refreshtoken|secret|clientsecret)$/i.test(k.replace(/[_-]/g,''))?'REDACTED_CREDENTIAL_FIELD':redact(v)]));
 return value;
}
export function evidence(s:State){
 return redact({tool:'SPLICE LOCAL OPERATOR',network:{chainId:s.chainId,rpc:'https://studio.genlayer.com/api'},sourceSHA256:s.sourceSha,baseCommit:s.baseCommit,exportedAt:new Date().toISOString(),deployment:s.contract??'NOT RUN',walletA:s.walletA??'NOT RUN',walletB:s.walletB??'NOT RUN',steps:Object.fromEntries(STEPS.map(k=>[k,s.entries[k]??{status:'NOT RUN'}])),semantic:s.semantic??'NOT VERIFIED',diagnostic:s.diagnostic??'NOT RUN',status:s.entries.T04?.status==='VERIFIED'&&s.semantic&&!s.halt?'REAL ONCHAIN FUSION VERIFIED':s.halt?'STOPPED':'NOT RUN LIVE / INCOMPLETE',halt:s.halt??null,unverified:['Exact GenVM node binary version',...STEPS.filter(k=>s.entries[k]?.status!=='VERIFIED').map(k=>k+' real transaction and readback'),...(!s.semantic?['Human comparison of both source features and fusion interaction']:[])]});
}
