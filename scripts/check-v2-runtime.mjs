// READ ONLY: Stable schema-stage probes, never deploy or simulate a write.
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source=readFileSync('intelligent-contract/contracts/creative_fusion.py','utf8');
const client=createClient({chain:studionet,endpoint:'https://studio.genlayer.com/api'});
const previous=JSON.parse(readFileSync('V2_RUNTIME_PROBE.json','utf8'));
const report={sourceSHA256:createHash('sha256').update(source).digest('hex'),chainId:61999,readOnly:true,contractVersion:'SPLICE-V2',probes:previous.probes,realModel:'NOT VERIFIED',realOnchain:'NOT VERIFIED'};
if(await client.getChainId()!==61999)throw new Error('CHAIN_MISMATCH');
const cases=[['runtime_helpers',source+'\n'+readFileSync('diagnostics/fast-2f/runtime_helpers.py','utf8')],['log_visibility',source+'\ndiagnostic("RUNTIME_LOG_PROBE")\nraise Exception("V2_RUNTIME_SENTINEL")\n']];
for(const [name,code] of cases){try{const schema=await client.getContractSchemaForCode(code);report.probes.push({name,outcome:'RETURNED_SCHEMA',schemaKeys:Object.keys(schema)});}catch(e){report.probes.push({name,outcome:'ERROR',message:String(e.message).slice(0,4000)});}}
report.checkedAt=new Date().toISOString();writeFileSync('V2_RUNTIME_PROBE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
