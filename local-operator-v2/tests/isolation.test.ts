// Synthetic local-state and provider tests; no real wallet or RPC.
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {DEPLOYMENT_ENABLED,SOURCE_SHA,V1_CONTRACT} from '../src/config';
import {Store,fresh,KEY,validateState} from '../src/store';
import {Operator} from '../src/engine';
import {callArgs} from '../src/sdk';
const OLD_KEY='splice.fast2c.operator.v1';
beforeEach(()=>localStorage.clear());
describe('V2 isolation and authorized release',()=>{
 it('leaves all V1 progress byte-for-byte untouched when loading and saving V2',()=>{
  const old='{"version":1,"entries":{"T04":{"status":"FAILED","hash":"old-hash"}}}';
  localStorage.setItem(OLD_KEY,old);const store=new Store();const s=store.load();store.save(s);
  expect(s.version).toBe(2);expect(s.sourceSha).toBe(SOURCE_SHA);expect(s.entries).toEqual({});
  expect(KEY).not.toBe(OLD_KEY);expect(localStorage.getItem(OLD_KEY)).toBe(old);
 });
 it('rejects V1 state inserted in the V2 namespace instead of migrating or resetting it',()=>{
  const old=JSON.stringify({...fresh(),version:1});localStorage.setItem(KEY,old);
  expect(()=>new Store().load()).toThrow('STORAGE BLOCKED');expect(localStorage.getItem(KEY)).toBe(old);
 });
 it('rejects the known V1 address and old source hash',()=>{
  expect(()=>validateState({...fresh(),contract:V1_CONTRACT})).toThrow('旧 V1');
  expect(()=>validateState({...fresh(),sourceSha:'cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e'})).toThrow();
 });
 it('cannot reuse old work IDs or readbacks as V2 fusion parents',()=>{
  const s:any=fresh();s.entries.T02={reads:{work:{id:1,version:'SPLICE-V1'}}};s.entries.T03={reads:{work:{id:2,version:'SPLICE-V1'}}};
  expect(()=>callArgs(s,'T04','fresh-v2-request')).toThrow('V2');
  s.entries.T02.reads.work.version='SPLICE-V2';s.entries.T03.reads.work.version='SPLICE-V2';
  expect(()=>callArgs(s,'T04','fresh-v2-request')).toThrow('V2'); // Not VERIFIED, no deployment binding.
 });
 it('uses the real authorized production flag',()=>expect(DEPLOYMENT_ENABLED).toBe(true));
});
