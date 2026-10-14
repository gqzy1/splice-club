import {beforeEach,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({readContract:vi.fn(),getTransaction:vi.fn(),writeContract:vi.fn()}));
vi.mock('genlayer-js',()=>({createClient:vi.fn(()=>mocks)}));
import {DEPLOYMENT} from '../src/config';
import * as chain from '../src/chain';
import {work} from './fixtures';
const account=('0x'+'a'.repeat(40)) as `0x${string}`;
const hash=('0x'+'1'.repeat(64)) as any;
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();DEPLOYMENT.address=null;delete window.ethereum;});
it('predeployment reads fail without calling network',async()=>{await expect(chain.gallery()).rejects.toThrow(/not deployed/);expect(mocks.readContract).not.toHaveBeenCalled();});
it('rejects missing wallet',async()=>await expect(chain.connect()).rejects.toThrow(/Install/));
it('propagates wallet cancellation',async()=>{window.ethereum={request:vi.fn().mockRejectedValue({code:4001})};try{await chain.connect();}catch(e){expect(chain.walletError(e)).toMatch(/declined/);}});
it('switches only to Stable chain',async()=>{const request=vi.fn().mockImplementation(({method})=>Promise.resolve(method==='eth_requestAccounts'?[account]:method==='eth_chainId'?'0xf22f':null));window.ethereum={request};expect((await chain.connect()).account).toBe(account);expect(request).toHaveBeenCalledWith({method:'wallet_switchEthereumChain',params:[{chainId:'0xf22f'}]});});
it('refuses wrong network before submit',async()=>{DEPLOYMENT.address=account;const provider={request:vi.fn().mockResolvedValue('0x1')};await expect(chain.write({account,provider},'fusion',[work(),work(2)],vi.fn())).rejects.toThrow(/network changed/);expect(mocks.writeContract).not.toHaveBeenCalled();});
it('confirms saved work only after consensus and readback',async()=>{DEPLOYMENT.address=account;const p={account,hash,kind:'seed' as const,requestId:'request-test'};mocks.getTransaction.mockResolvedValue({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN'});mocks.readContract.mockResolvedValueOnce(1).mockResolvedValueOnce(JSON.stringify(work()));const update=vi.fn();expect(await chain.track(p,update)).toEqual(work());expect(update).toHaveBeenLastCalledWith(expect.objectContaining({phase:'success'}));});
it('does not reveal a work for an execution error',async()=>{DEPLOYMENT.address=account;mocks.getTransaction.mockResolvedValue({statusName:'FINALIZED',txExecutionResult:2});await expect(chain.track({account,hash,kind:'seed',requestId:'request-test'},vi.fn())).rejects.toThrow(/contract error/);expect(mocks.readContract).not.toHaveBeenCalled();});
it('blocks resubmission of pending hash',async()=>{localStorage.setItem('splice.pending.v1',JSON.stringify({account,hash,kind:'seed',requestId:'request-test'}));await expect(chain.write({account,provider:{request:vi.fn()}},'fusion',[],vi.fn())).rejects.toThrow(/already waiting/);expect(mocks.writeContract).not.toHaveBeenCalled();});
it('blocks signing if browser recovery storage is unavailable',async()=>{DEPLOYMENT.address=account;const provider={request:vi.fn().mockImplementation(({method})=>Promise.resolve(method==='eth_chainId'?'0xf22f':[account]))};const storage=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('blocked');});await expect(chain.write({account,provider},'seed',{name:'Valid Seed',description:'A character with a distinctive creative mechanism.',features:['distinctive mechanism'],category:'creature',allow:true},vi.fn())).rejects.toThrow(/browser storage/);expect(mocks.writeContract).not.toHaveBeenCalled();storage.mockRestore();});
it('blocks SDK fallback after an uncertain wallet submission and keeps recovery intent',async()=>{
 DEPLOYMENT.address=account;Object.assign(mocks,{estimateTransactionGas:vi.fn().mockResolvedValue(200000n),request:vi.fn().mockResolvedValue('0x0')});
 const request=vi.fn().mockImplementation(({method})=>method==='eth_chainId'?Promise.resolve('0xf22f'):method==='eth_accounts'?Promise.resolve([account]):Promise.reject(new Error('transport lost')));
 const guarded=chain.guardedProvider({account,provider:{request}},{kind:'seed',requestId:'request-safe'});
 const tx={method:'eth_sendTransaction',params:[{to:account,data:'0x00',value:'0x0'}]};
 await expect(guarded.request(tx)).rejects.toThrow(/transport lost/);expect(chain.unresolvedSubmission()).toBe(true);
 await expect(guarded.request(tx)).rejects.toThrow(/already attempted/);expect(request.mock.calls.filter(c=>c[0].method==='eth_sendTransaction')).toHaveLength(1);
});
it('persists hash at the wallet boundary and clears uncertain intent',async()=>{
 DEPLOYMENT.address=account;Object.assign(mocks,{estimateTransactionGas:vi.fn().mockResolvedValue(200000n),request:vi.fn().mockResolvedValue('0x0')});
 const request=vi.fn().mockImplementation(({method})=>Promise.resolve(method==='eth_chainId'?'0xf22f':method==='eth_accounts'?[account]:hash));
 const guarded=chain.guardedProvider({account,provider:{request}},{kind:'seed',requestId:'request-safe'});
 await guarded.request({method:'eth_sendTransaction',params:[{to:account,data:'0x00',value:'0x0'}]});expect(chain.pending()?.hash).toBe(hash);expect(chain.unresolvedSubmission()).toBe(false);
});
it('stops signing when fresh estimation fails or a nonzero gas price appears',async()=>{
 DEPLOYMENT.address=account;const estimate=vi.fn().mockRejectedValue(new Error('estimate unavailable'));Object.assign(mocks,{estimateTransactionGas:estimate,request:vi.fn().mockResolvedValue('0x1')});
 const request=vi.fn().mockImplementation(({method})=>Promise.resolve(method==='eth_chainId'?'0xf22f':[account]));
 const guarded=chain.guardedProvider({account,provider:{request}},{kind:'seed',requestId:'request-safe'});const tx={method:'eth_sendTransaction',params:[{to:account,data:'0x00',value:'0x0'}]};
 await expect(guarded.request(tx)).rejects.toThrow(/estimate unavailable/);estimate.mockResolvedValue(200000n);await expect(guarded.request(tx)).rejects.toThrow(/Nonzero fee/);
 expect(request.mock.calls.filter(c=>c[0].method==='eth_sendTransaction')).toHaveLength(0);
});
