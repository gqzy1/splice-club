// READ ONLY: no account, provider, deployment, simulation or transaction submission.
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const client=createClient({chain:studionet,endpoint:'https://studio.genlayer.com/api'});
const code=readFileSync('intelligent-contract/contracts/creative_fusion.py','utf8');
const report={network:'Stable Studionet',chainId:61999,sdk:'1.1.8',readOnly:true,version:'SPLICE-V2',sourceSha256:createHash('sha256').update(code).digest('hex'),recordedAtUtc:new Date().toISOString()};
try{
 report.returnedChainId=await client.getChainId();
 if(report.returnedChainId!==61999)throw Error('CHAIN_MISMATCH');
 report.schema=await client.getContractSchemaForCode(code);
 report.status='READ_ONLY_SCHEMA_PASS';
}catch(e){report.status='UNVERIFIED';report.error=String(e.message||e);}
writeFileSync('STABLE_COMPATIBILITY_V2.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,chain:report.returnedChainId,error:report.error,schemaKeys:report.schema?Object.keys(report.schema):[]}));
