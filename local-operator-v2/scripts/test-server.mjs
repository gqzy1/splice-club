// Local server boundary check. No browser, wallet or remote RPC involved.
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import http from 'node:http';
const child=spawn(process.execPath,['scripts/launch.mjs'],{stdio:['ignore','pipe','pipe']});
try{
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('SERVER_START_TIMEOUT')),10000);
  child.stdout.on('data',x=>{if(String(x).includes('http://127.0.0.1:4180')){clearTimeout(timer);resolve();}});
  child.stderr.on('data',x=>{clearTimeout(timer);reject(new Error(String(x)));});
  child.on('exit',c=>{clearTimeout(timer);reject(new Error('Server exited '+c));});
 });
 const url='http://127.0.0.1:4180',probes=[];
 for(const [name,opts] of [['GET',{}],['POST',{method:'POST'}],['bad-origin',{headers:{Origin:'https://example.com'}}]]){
  const r=await fetch(url,opts);probes.push({name,status:r.status,csp:r.headers.get('content-security-policy')});
 }
 probes.push({name:'bad-host',status:await new Promise((resolve,reject)=>http.get(url,{headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject))});
 if(JSON.stringify(probes.map(x=>x.status))!=='[200,403,403,403]')throw new Error('SERVER_BOUNDARY_FAILED');
 writeFileSync('V2_LOCAL_SERVER_QA.json',JSON.stringify({status:'PASS',kind:'LOCAL HTTP / NOT REAL BROWSER',port:4180,probes,realWallet:'NOT VERIFIED',realBrowser:'NOT VERIFIED; automated download returned truncated archive',checkedAt:new Date().toISOString()},null,2)+'\n');
 console.log('LOCAL_SERVER_PASS',probes.map(x=>[x.name,x.status]));
}finally{child.kill();}
