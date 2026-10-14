import snapshot from './verified-evidence.json';
import {parseWork} from './domain';
import type {Lineage} from './types';
export const EVIDENCE=snapshot;
export const evidenceWorks=()=>snapshot.works.map(parseWork);
export function evidenceLineage(id:number):Lineage {
 const work=evidenceWorks().find(w=>w.id===id);
 if(!work)throw new Error('This work is not in the captured evidence. Retry a live read.');
 return {work,parents:work.parents.map(id=>evidenceWorks().find(w=>w.id===id)!)};
}
