export type Category = 'creature'|'object'|'world'|'wildcard';
export type Work = {id:number; kind:'seed'|'fusion';name:string;description:string;features:string[];category:Category;creator:string;parents:number[];parent_creators:string[];parent_hashes?:string[];input_hash?:string;bridge?:string;depth:number;license:string;version:string;request_fingerprint:string};
export type Lineage = {work:Work;parents:Work[]};
export type Phase = 'idle'|'signing'|'submitted'|'pending'|'accepted'|'finalized'|'success'|'rejected'|'failed'|'unknown';
export type Progress = {phase:Phase;label:string;hash?:string;requestId?:string};
export type SeedInput = {name:string;description:string;features:string[];category:Category;allow:boolean};
