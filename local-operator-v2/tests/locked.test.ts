import {it,expect,vi} from 'vitest';
import {DEPLOYMENT_ENABLED} from '../src/config';
import {Store} from '../src/store';
import {Operator} from '../src/engine';
vi.mock('../src/config',async original=>({...await original<typeof import('../src/config')>(),DEPLOYMENT_ENABLED:false}));
 it('blocks prepare and submit before any provider, RPC, intent or signature action',async()=>{
  expect(DEPLOYMENT_ENABLED).toBe(false);const p={request:vi.fn()},store=new Store(),op=new Operator(store);
  await expect(op.prepare(p as any,'T01')).rejects.toThrow('DEPLOYMENT LOCKED');
  await expect(op.submit(p as any,{} as any)).rejects.toThrow('DEPLOYMENT LOCKED');
  expect(p.request).not.toHaveBeenCalled();expect(store.load().entries).toEqual({});
 });
