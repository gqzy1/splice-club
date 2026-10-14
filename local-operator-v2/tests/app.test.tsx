// Actual authorized V2 UI, synthetic DOM only; NOT a real browser/wallet run.
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
import {afterEach,it,expect,vi} from 'vitest';
import {App} from '../src/App';
afterEach(()=>{cleanup();vi.unstubAllGlobals();localStorage.clear();});
it('renders V2 identity and keeps all prepare buttons gated before wallet readiness without touching V1 progress',async()=>{
 vi.stubGlobal('crypto',webcrypto);localStorage.setItem('splice.fast2c.operator.v1','{"original":"V1 progress"}');
 const fetch=vi.fn(()=>{throw new Error('Unexpected network call');});vi.stubGlobal('fetch',fetch);
 render(<App/>);await waitFor(()=>expect(screen.getByText(/SHA256 PASS/)).toBeTruthy());
 expect(screen.getByText(/FAST-2G \/ V2/)).toBeTruthy();
 expect(screen.getByText(/AUTHORIZED V2 LOCAL OPERATOR/)).toBeTruthy();
 for(const step of ['T01','T02','T03','T04'])expect(screen.getByRole('button',{name:`准备 ${step}（只读）`}).hasAttribute('disabled')).toBe(true);
 expect(localStorage.getItem('splice.fast2c.operator.v1')).toBe('{"original":"V1 progress"}');
 expect(fetch).not.toHaveBeenCalled();expect(screen.queryByRole('button',{name:/SIGN T01/})).toBeNull();
});

it('gates the authorized UI through explicit OKX selection and detects account/network changes (MOCK DOM)',async()=>{
 const {fireEvent,act}=await import('@testing-library/react');
 const A='0x'+'a'.repeat(40),B='0x'+'b'.repeat(40);let account=A,chain='0xf22f';
 const listeners=new Map<string,()=>void>();
 const p={isOkxWallet:true,on:(k:string,fn:()=>void)=>listeners.set(k,fn),removeListener:(k:string)=>listeners.delete(k),request:vi.fn(async({method}:{method:string})=>{
  if(method==='eth_accounts'||method==='eth_requestAccounts')return [account];
  if(method==='eth_chainId')return chain;
  if(method==='eth_gasPrice')return '0x0';
  if(method==='eth_getBalance')return '0x100';
  throw new Error('Unexpected wallet call '+method);
 })};
 vi.stubGlobal('crypto',webcrypto);
 vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{const {method}=JSON.parse(init.body);return {ok:true,json:async()=>({result:method==='eth_chainId'?'0xf22f':method==='eth_gasPrice'?'0x0':'0x100'})};}));
 (window as any).okxwallet=p;
 try{
  render(<App/>);await waitFor(()=>expect(screen.getByText(/SHA256 PASS/)).toBeTruthy());
  fireEvent.change(screen.getByRole('combobox',{name:/Provider/}),{target:{value:'okx-injected'}});
  fireEvent.click(screen.getByRole('checkbox',{name:/Provider/}));fireEvent.click(screen.getByRole('button',{name:'CONNECT OKX WALLET'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'准备 T01（只读）'}).hasAttribute('disabled')).toBe(false));
  expect(p.request.mock.calls.some(([x])=>x.method==='eth_sendTransaction')).toBe(false);
  account=B;await act(async()=>listeners.get('accountsChanged')?.());
  await waitFor(()=>expect(screen.getByText(B)).toBeTruthy());
  expect(screen.getByRole('button',{name:'准备 T01（只读）'}).hasAttribute('disabled')).toBe(true);
  chain='0x1';await act(async()=>listeners.get('chainChanged')?.());
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('61999'));
  expect(screen.getByRole('button',{name:'准备 T01（只读）'}).hasAttribute('disabled')).toBe(true);
 }finally{delete (window as any).okxwallet;}
});
