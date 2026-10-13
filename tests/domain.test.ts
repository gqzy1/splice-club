import {describe,it,expect} from 'vitest';
import {choosePair,pairError,validateSeed,parseWork,lifecycle} from '../src/domain';
import {work} from './fixtures';
const b=work(2,'0x'+'b'.repeat(40));
describe('selection shared by touch, click and drop',()=>{
 it('toggles and replaces bounded pair',()=>{let p=choosePair([],work());p=choosePair(p,b);expect(pairError(p)).toBeNull();expect(choosePair(p,work())).toEqual([b]);expect(choosePair(p,work(3,'0x'+'c'.repeat(40))).map(w=>w.id)).toEqual([2,3]);});
 it('rejects same authors and children',()=>{expect(pairError([work(),work(2)])).toMatch(/different creators/);expect(choosePair([],{...b,kind:'fusion'})).toEqual([]);});
});
describe('seed guard',()=>{
 const s={name:'Moon Laundry',description:'A moon powered laundromat that folds light.',features:['folds moonlight'],category:'object' as const,allow:true};
 it('accepts bounded input',()=>expect(validateSeed(s)).toBeNull());
 it.each([{...s,allow:false},{...s,name:'x'},{...s,description:'short'},{...s,features:['same','same']},{...s,name:'Bad\nname'}])('rejects unsafe input',v=>expect(validateSeed(v)).toBeTruthy());
});
describe('contract data',()=>{
 it('parses serialized work',()=>expect(parseWork(JSON.stringify(work()))).toEqual(work()));
 it.each([{...work(),creator:'fake'},{...work(),version:'wrong'},{...work(),parents:[1]},{...work(),id:-1}])('fails closed',v=>expect(()=>parseWork(v)).toThrow());
});
describe('transaction lifecycle',()=>{
 it('requires finalization, agreement and return',()=>{expect(lifecycle({statusName:'ACCEPTED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN'}).phase).toBe('accepted');expect(lifecycle({statusName:'FINALIZED',resultName:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN'}).phase).toBe('finalized');});
 it('distinguishes contract rejection and consensus failure',()=>{expect(lifecycle({statusName:'FINALIZED',txExecutionResult:2}).phase).toBe('rejected');expect(lifecycle({statusName:'UNDETERMINED'}).phase).toBe('failed');expect(lifecycle({statusName:'FINALIZED',resultName:'MAJORITY_DISAGREE'}).phase).toBe('failed');});
 it('does not imply success for missing execution',()=>expect(lifecycle({statusName:'FINALIZED',resultName:'MAJORITY_AGREE'}).phase).toBe('failed'));
});
