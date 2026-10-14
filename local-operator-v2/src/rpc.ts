import {CHAIN,RPC,isAddress,same} from './config';
import {walletState,type Provider} from './wallet';
export async function rpc(method:string,params:any[]=[]):Promise<any>{
 if(!['eth_chainId','eth_getBalance','eth_gasPrice','eth_estimateGas','eth_getTransactionCount','eth_getTransactionByHash','eth_getTransactionReceipt','gen_call'].includes(method))throw new Error('RPC UNSUPPORTED: 非只读方法。');
 let response:Response;
 try{response=await fetch(RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method,params}),signal:AbortSignal.timeout(15000),redirect:'error',credentials:'omit'});}catch(e){throw new Error('NETWORK BLOCKED: 本机浏览器无法读取指定 RPC（可能 CORS、网络或超时；无法仅凭浏览器异常区分）。'+String(e));}
 if(!response.ok)throw new Error(`NETWORK BLOCKED: RPC HTTP ${response.status}${response.status===403?' / 403 ACCESS DENIED':''}`);
 const body=await response.json();if(body.error)throw new Error(`${body.error.code===-32601?'RPC UNSUPPORTED':'RPC BLOCKED'}: ${method} ${body.error.code} ${body.error.message}`);
 if(!Object.hasOwn(body,'result'))throw new Error('RPC BLOCKED: 返回缺少 result。');return body.result;
}
export function quantity(x:any,label:string){if(typeof x!=='string'||!/^0x[0-9a-f]+$/i.test(x))throw new Error('RPC UNSUPPORTED: '+label+' 不是十六进制数量。');return BigInt(x);}
export async function readiness(p:Provider){
 const wallet=await walletState(p);
 const chain=await rpc('eth_chainId');if(quantity(chain,'chain')!==BigInt(CHAIN))throw new Error('NETWORK BLOCKED: RPC 链不是 61999。');
 // Also query the selected wallet's RPC, independently from direct SDK RPC.
 const walletBalance=await p.request({method:'eth_getBalance',params:[wallet.account,'latest']});
 const walletPrice=await p.request({method:'eth_gasPrice'});
 const balance=await rpc('eth_getBalance',[wallet.account,'latest']);const gasPrice=await rpc('eth_gasPrice');
 quantity(balance,'balance');quantity(walletBalance,'walletBalance');
 if(quantity(gasPrice,'gasPrice')!==0n||quantity(walletPrice,'wallet gasPrice')!==0n)throw new Error('STOP: 当前真实 Gas Price 非零，禁止交易。');
 return {...wallet,rpc:RPC,chainId:CHAIN,balance,walletBalance,gasPrice,walletPrice,status:'READINESS PASS',checkedAt:new Date().toISOString(),rpcEndpointAttestation:'Wallet URL cannot be introspected through EIP-1193; add/switch parameters fixed to official RPC. Both chain IDs and read responses checked.'};
}
export async function verifyBoundary(p:Provider,tx:any,expectedAccount:string){
 const ready=await readiness(p);
 if(!same(ready.account,expectedAccount)||!same(tx.from,expectedAccount)||!isAddress(tx.to)||!/^0x[0-9a-f]+$/i.test(tx.data)||Number(tx.chainId)!==CHAIN||quantity(tx.value,'value')!==0n)throw new Error('SIGNING BLOCKED: from/to/data/value/chain 不匹配。');
 const estimateParams={from:tx.from,to:tx.to,data:tx.data,value:'0x0'};
 const gas=await rpc('eth_estimateGas',[estimateParams]);
 if(quantity(gas,'gas')<=0n)throw new Error('RPC UNSUPPORTED: 无效 Gas 估计。');
 // Strictly compare wallet's estimate as well; neither failure has a gas fallback.
 const walletGas=await p.request({method:'eth_estimateGas',params:[estimateParams]});
 if(quantity(walletGas,'wallet gas')<=0n)throw new Error('RPC UNSUPPORTED: 钱包 Gas 估计无效。');
 const nonce=await rpc('eth_getTransactionCount',[tx.from,'pending']);quantity(nonce,'nonce');
 return {ready,gas,nonce,walletGas};
}
