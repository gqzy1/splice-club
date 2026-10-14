// No browser wallet, signatures or remote RPC. Exercise the actual shipped build/server.
import assert from 'node:assert/strict';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=mkdtempSync(path.join(tmpdir(),'splice-fast2g-')),pkg=path.join(temp,'operator');
const run=()=>spawnSync(process.execPath,['scripts/verify-source.mjs'],{cwd:pkg,encoding:'utf8'});
let child;
try{
 cpSync(root,pkg,{recursive:true,filter:p=>!p.split(path.sep).includes('node_modules')});
 assert.equal(run().status,0,'extracted package integrity');
 const manifest=JSON.parse(readFileSync(path.join(pkg,'INTEGRITY.json')));
 const expectedFiles=Object.keys(manifest).length;
 const manifestBytes=readFileSync(path.join(pkg,'INTEGRITY.json'));
 rmSync(path.join(pkg,'INTEGRITY.json'));assert.notEqual(run().status,0,'missing manifest must fail');
 writeFileSync(path.join(pkg,'INTEGRITY.json'),manifestBytes);
 const index=path.join(pkg,'dist/index.html'),original=readFileSync(index);
 writeFileSync(index,Buffer.concat([original,Buffer.from('tampered')]));assert.notEqual(run().status,0,'tampered dist must fail');
 writeFileSync(index,original);
 rmSync(index);assert.notEqual(run().status,0,'missing dist must fail');writeFileSync(index,original);
 const config=path.join(pkg,'src/config.ts'),configBytes=readFileSync(config);
 writeFileSync(config,Buffer.concat([configBytes,Buffer.from('// tampered')]));assert.notEqual(run().status,0,'tampered config must fail');writeFileSync(config,configBytes);
 assert.equal(run().status,0,'restored package');
 const cmd=readFileSync(path.join(pkg,'START_SPLICE_LOCAL.cmd'),'utf8');
 assert(cmd.includes('\r\n'),'Windows CRLF');assert(cmd.includes('npm ci --ignore-scripts'));
 assert(!cmd.includes('npm run build'),'no unreviewed dist rebuild');
 assert(!/eth_sendTransaction|deployContract|writeContract/.test(cmd),'no auto deployment in startup');
 child=spawn(process.execPath,['scripts/launch.mjs'],{cwd:pkg,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('startup timeout')),10000);
  child.stdout.on('data',x=>{if(String(x).includes('http://127.0.0.1:4180')){clearTimeout(timer);resolve();}});
  child.stderr.on('data',x=>{clearTimeout(timer);reject(new Error(String(x)));});
  child.on('exit',c=>{clearTimeout(timer);reject(new Error('exit '+c));});
 });
 const html=await fetch('http://127.0.0.1:4180/');assert.equal(html.status,200);assert.equal(await html.text(),original.toString());
 let bundles='';let servedFiles=0;
 for(const [file,hash] of Object.entries(manifest).filter(([p])=>p.startsWith('dist/'))){
  const response=await fetch('http://127.0.0.1:4180/'+file.slice(5));assert.equal(response.status,200);
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  assert.equal(response.headers.get('cache-control'),'no-store');
  if(file.endsWith('.js'))bundles+=bytes.toString();servedFiles++;
 }
 assert(bundles.includes('AUTHORIZED V2 LOCAL OPERATOR'));
 assert(bundles.includes('4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1'));
 assert(!bundles.includes('V2 尚未获交易授权'));
 assert(!bundles.includes('V2 CANDIDATE · DEPLOYMENT LOCKED'));
 const second=spawnSync(process.execPath,['scripts/launch.mjs'],{cwd:pkg,encoding:'utf8',timeout:5000});
 assert.notEqual(second.status,0);assert(second.stderr.includes('4180'));
 console.log(JSON.stringify({status:'PASS',kind:'LOCAL HTTP / PACKAGE STATIC CHECKS',manifestFiles:expectedFiles,servedBuildFiles:servedFiles,integrityTampering:'missing manifest / missing dist / altered dist / altered config rejected',windows:'CRLF/startup static checks PASS; native Windows NOT RUN',portConflict:'STOP PASS',authorizedBuild:'actual served bundle hash and marker PASS',realBrowser:'BLOCKED: Chromium download truncated',realWallet:'NOT RUN',realOnchain:'NOT RUN'},null,2));
}finally{child?.kill();rmSync(temp,{recursive:true,force:true});}
