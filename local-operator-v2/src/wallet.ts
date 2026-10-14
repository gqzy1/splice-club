import {CHAIN,CHAIN_HEX,RPC,isAddress} from './config';
export type Provider={request:(args:{method:string;params?:any})=>Promise<any>;on?:(event:string,fn:(...args:any[])=>void)=>void;removeListener?:(event:string,fn:(...args:any[])=>void)=>void;isOkxWallet?:boolean};
export type Choice={id:string;name:string;rdns:string;provider:Provider;okx:boolean};
export function choice(detail:any):Choice|null{
 if(!detail?.provider||typeof detail.provider.request!=='function'||typeof detail.info?.uuid!=='string'||typeof detail.info?.name!=='string')return null;
 const rdns=String(detail.info.rdns||'');
 return {id:detail.info.uuid,name:detail.info.name.slice(0,80),rdns,provider:detail.provider,okx:rdns==='com.okex.wallet'||rdns==='com.okx.wallet'};
}
export function discover(update:(choices:Choice[])=>void){
 const found=new Map<string,Choice>();
 const publish=()=>update([...found.values()]);
 const receive=(e:Event)=>{const c=choice((e as CustomEvent).detail);if(c){found.set(c.id,c);publish();}};
 window.addEventListener('eip6963:announceProvider',receive);
 const scan=()=>{const p=(window as any).okxwallet;if(p?.isOkxWallet===true&&typeof p.request==='function'&&![...found.values()].some(c=>c.provider===p))found.set('okx-injected',{id:'okx-injected',name:'OKX Wallet — window.okxwallet',rdns:'OKX namespace / isOkxWallet',provider:p,okx:true});publish();window.dispatchEvent(new Event('eip6963:requestProvider'));};
 scan();const timer=setInterval(scan,2000);
 return ()=>{clearInterval(timer);window.removeEventListener('eip6963:announceProvider',receive);};
}
export async function walletState(p:Provider){
 const chain=await p.request({method:'eth_chainId'});
 const accounts=await p.request({method:'eth_accounts'});
 if(Number(chain)!==CHAIN)throw new Error('WALLET BLOCKED: 请配置 Stable Studionet 61999。');
 if(!Array.isArray(accounts)||!isAddress(accounts[0]))throw new Error('WALLET BLOCKED: 未取得当前公开地址。');
 return {account:accounts[0] as `0x${string}`,chain:Number(chain)};
}
export async function connect(c:Choice){if(!c.okx)throw new Error('WALLET BLOCKED: 请明确选择 OKX Wallet。');await c.provider.request({method:'eth_requestAccounts'});return walletState(c.provider);}
export async function configure(p:Provider){
 try{await p.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]});}
 catch(e){if(Number((e as any)?.code)!==4902)throw e;await p.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN_HEX,chainName:'GenLayer Studionet',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},rpcUrls:[RPC]}]});await p.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]});}
 return walletState(p);
}
