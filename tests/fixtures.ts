import type {Work} from '../src/types';
// Test-only synthetic input; never imported by src or shipped as gallery data.
export const work=(id=1,creator='0x'+'a'.repeat(40)):Work=>({id,creator,kind:'seed',name:'Moon Laundry '+id,description:'A moon powered laundromat folds light to wash memories.',features:['folds moonlight'],category:'object',parents:[],parent_creators:[],depth:0,license:'PUBLIC-DERIVATION-V1',version:'SPLICE-V1',request_fingerprint:'a'.repeat(64)});
