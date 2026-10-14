// Isolated browser QA. ALL RPC replies, accounts, hashes and outputs are MOCK.
const {chromium}=require(process.env.SPLICE_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
let server,debugPage;process.on('exit',()=>server?.kill());
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 server=require('node:child_process').spawn(process.execPath,[ROOT+'/scripts/launch.mjs'],{stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',x=>{if(String(x).includes('SPLICE LOCAL OPERATOR:'))resolve();});server.stderr.on('data',x=>reject(new Error(String(x))));server.on('exit',c=>reject(new Error('Server exited '+c)));});
 const probes=[];for(const [label,init] of [['GET',{}],['POST',{method:'POST'}],['bad-origin',{headers:{Origin:'https://example.com'}}]]){const r=await fetch('http://127.0.0.1:4179',init);probes.push({label,status:r.status});}
 const hostStatus=await new Promise((resolve,reject)=>{require('node:http').get('http://127.0.0.1:4179',{headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});probes.push({label:'bad-host',status:hostStatus});if(JSON.stringify(probes.map(p=>p.status))!=='[200,403,403,403]')throw new Error('Local server boundary failed '+JSON.stringify(probes));
 const {abi}=await import(ROOT+'/node_modules/genlayer-js/dist/index.js');
 const {studionet}=await import(ROOT+'/node_modules/genlayer-js/dist/chains/index.js');
 const {decodeFunctionData,fromRlp,fromHex,toHex}=await import(ROOT+'/node_modules/viem/_esm/index.js');
 const A='0x'+'a'.repeat(40),B='0x'+'b'.repeat(40),CONTRACT='0x'+'c'.repeat(40),SOURCE=fs.readFileSync(ROOT+'/contracts/creative_fusion.py');
 const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>canonical(k)+':'+canonical(x[k])).join(',')+'}';
 const digest=x=>crypto.createHash('sha256').update(canonical(x)).digest('hex');
 let current=A,sends=0;const nonces={[A]:0,[B]:0},transactions={},works={},requests={};
 const calls=[],errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.SPLICE_CHROMIUM_EXECUTABLE?{executablePath:process.env.SPLICE_CHROMIUM_EXECUTABLE}:{}),args:JSON.parse(process.env.SPLICE_CHROMIUM_ARGS||'[]')});const ctx=await browser.newContext({acceptDownloads:true});const page=await ctx.newPage();debugPage=page;
 await page.exposeFunction('__mockRequest',async({method,params=[]})=>{
  calls.push({method,kind:'MOCK'});
  if(method==='eth_accounts'||method==='eth_requestAccounts')return [current];
  if(method==='eth_chainId')return '0xf22f';
  if(method==='eth_getBalance')return '0x100';
  if(method==='eth_gasPrice')return '0x0';
  if(method==='eth_estimateGas')return '0x5208';
  if(method==='eth_sendTransaction'){
   const tx=params[0];if(tx.from.toLowerCase()!==current||tx.value!=='0x0'||tx.gasPrice!=='0x0'||tx.chainId!=='0xf22f')throw new Error('MOCK boundary mismatch');
   const d=decodeFunctionData({abi:studionet.consensusMainContract.abi,data:tx.data});const args=d.args,parts=fromRlp(args[4]);const deploy=parts.length===3;
   const call=parts[deploy?1:0],value=abi.calldata.decode(fromHex(call,'bytes')),fn=value.get('method'),ca=value.get('args')||[];
   if(!deploy){
    if(fn==='create_seed'){
     const [name,description,features,category,allow,rid]=ca;if(!allow)throw new Error('missing allow');
     const id=Object.keys(works).length===0?11:27;
     const record={kind:'seed',name,description,features,category,parents:[],parent_creators:[],depth:0};
     works[id]={...record,id,creator:current,version:'SPLICE-V1',license:'PUBLIC-DERIVATION-V1',request_fingerprint:digest(record)};requests[current+':'+rid]=id;
    }else if(fn==='fuse'){
     const [a,b,rid]=ca,parents=[works[Number(a)],works[Number(b)]].sort((a,b)=>a.id-b.id);
     works[42]={id:42,kind:'fusion',name:'MOCK Resonance Beetle',description:'Prismatic shell refracts moonlight into woven tone threads; antenna rhythms steer the beams to release stored vibrations.',features:['prismatic shell refracts moonlight','weaves tones into threads','antenna rhythms trigger light releases'],bridge:'Rhythmic refracted beams activate stored vibrations woven into the shell.',category:'wildcard',parents:parents.map(p=>p.id),parent_creators:parents.map(p=>p.creator),parent_hashes:parents.map(digest),input_hash:digest({version:'SPLICE-V1',parents}),request_fingerprint:digest({snapshot:canonical({version:'SPLICE-V1',parents})}),depth:1,creator:current,version:'SPLICE-V1',license:'PUBLIC-DERIVATION-V1'};requests[current+':'+rid]=42;
    }else throw new Error('Unexpected MOCK function '+fn);
   }
   sends++;const hash='0x'+String(sends).repeat(64);
   transactions[hash]={hash,from_address:current,from:current,to_address:CONTRACT,recipient:CONTRACT,nonce:nonces[current]++,value:0,leader_only:false,execution_mode:'NORMAL',status:'FINALIZED',result_name:'MAJORITY_AGREE',txExecutionResultName:'FINISHED_WITH_RETURN',data:{calldata:Buffer.from(call.slice(2),'hex').toString('base64'),...(deploy?{contract_code:SOURCE.toString('base64')}:{})}};
   return hash;
  }
  throw new Error('Unexpected MOCK wallet method '+method);
 });
 await page.addInitScript(()=>{
  const listeners={};const okx={isOkxWallet:true,request:r=>window.__mockRequest(r),on:(k,fn)=>(listeners[k]??=[]).push(fn),removeListener:(k,fn)=>listeners[k]=(listeners[k]??[]).filter(f=>f!==fn)};
  window.okxwallet=okx;window.__switchMock=()=>{for(const fn of listeners.accountsChanged??[])fn([]);};
  window.ethereum={request:()=>{throw new Error('WRONG PROVIDER: METAMASK');}};
  window.addEventListener('eip6963:requestProvider',()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{uuid:'mock-mm',name:'MetaMask MOCK',rdns:'io.metamask'},provider:window.ethereum}})));
 });
 await page.route('https://studio.genlayer.com/**',async route=>{
  const {method,params=[]}=JSON.parse(route.request().postData());let result;
  calls.push({method,kind:'MOCK RPC'});
  if(method==='eth_chainId')result='0xf22f';else if(method==='eth_getBalance')result='0x100';else if(method==='eth_gasPrice')result='0x0';else if(method==='eth_estimateGas')result='0x5208';else if(method==='eth_getTransactionCount')result='0x'+nonces[params[0].toLowerCase()].toString(16);
  else if(method==='eth_getTransactionByHash')result=transactions[params[0]];
  else if(method==='eth_getTransactionReceipt')result={transactionHash:params[0],gasUsed:'0x5208',effectiveGasPrice:'0x0'};
  else if(method==='gen_call'){
   const parts=fromRlp(params[0].data),v=abi.calldata.decode(fromHex(parts[0],'bytes')),fn=v.get('method'),args=v.get('args')||[];let out;
   if(params[0].transaction_hash_variant!=='latest-final')throw new Error('Wrong read scope');
   if(fn==='total')out=Object.keys(works).length;
   else if(fn==='get_request')out=requests[String(args[0]).toLowerCase()+':'+args[1]]||0;
   else if(fn==='get_work')out=JSON.stringify(works[Number(args[0])]);
   else if(fn==='get_lineage'){const w=works[Number(args[0])];out=JSON.stringify({work:w,parents:w.parents.map(i=>works[i])});}
   else if(fn==='list_works')out=JSON.stringify(Object.values(works));else throw new Error('Unexpected MOCK read '+fn);
   result=toHex(abi.calldata.encode(out)).slice(2);
  }else throw new Error('Unexpected MOCK RPC '+method);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({jsonrpc:'2.0',id:1,result})});
 });
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4179');await page.getByText('SHA256 PASS').waitFor();
 if(sends!==0)throw new Error('Auto send on load');
 const select=page.locator('select').first();await select.selectOption('okx-injected');await page.getByRole('checkbox').first().check();await page.getByRole('button',{name:'CONNECT OKX WALLET',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('READINESS PASS')); 
 for(const step of ['T01','T02','T03','T04']){
  if(step==='T03'||step==='T04'){current=step==='T03'?B:A;await page.evaluate(()=>window.__switchMock());await page.getByRole('button',{name:'本地只读环境检查',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('READINESS PASS')); }
  await page.waitForFunction(step=>[...document.querySelectorAll('button')].some(b=>b.textContent==='准备 '+step+'（只读）'&&!b.disabled),step);await page.getByRole('button',{name:'准备 '+step+'（只读）',exact:true}).click();const sign=page.getByRole('button',{name:'SIGN '+step+' IN OKX — 仅此一笔',exact:true});await sign.waitFor();
  if(sends!==['T01','T02','T03','T04'].indexOf(step))throw new Error('Prepare sent a transaction');
  await page.locator('.preview input[type=checkbox]').check();await sign.click();
  await page.locator('article').filter({has:page.getByRole('heading',{name:step+' — '+({T01:'Deploy Contract',T02:'Create Seed A',T03:'Create Seed B',T04:'AI Fusion'}[step]),exact:true})}).getByText('VERIFIED',{exact:true}).waitFor({timeout:15000});
 }
 if(sends!==4)throw new Error('MOCK sends not exactly 4');
 await page.getByText('可选：记录真实原文证据',{exact:true}).click();await page.getByLabel('保留 A 特征的真实原文片段').fill('Prismatic shell refracts moonlight');await page.getByLabel('保留 B 特征的真实原文片段').fill('woven tone threads');await page.getByLabel('组合机制的真实原文片段').fill('antenna rhythms steer the beams to release stored vibrations');await page.getByLabel('我已对照真实父作品，确认保留 A 的独特核心特征。').check();await page.getByLabel('我已对照真实父作品，确认保留 B 的独特核心特征。').check();await page.getByLabel('我确认真实描述和特征形成了组合机制。').check();await page.getByRole('button',{name:'确认语义证据（只读、本地保存）',exact:true}).click();await page.getByText('REAL ONCHAIN FUSION VERIFIED',{exact:true}).waitFor();
 await page.reload();await page.getByText('REAL ONCHAIN FUSION VERIFIED',{exact:true}).waitFor();if(sends!==4)throw new Error('Reload sent a transaction');
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'EXPORT EVIDENCE',exact:true}).click()]);const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));if(exported.steps.T04.reads.work.id!==42)throw new Error('Export lost actual mock ID');
 await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Mobile overflow');
 const report={serverProbes:probes,label:'MOCK PASS — isolated browser, NOT REAL ONCHAIN',sends:4,steps:['deploy','seed A ID 11','seed B ID 27','fusion ID 42'],accountFlow:'A -> B -> A',explicitProvider:'OKX namespace selected; competing MetaMask fails if used',reload:'preserved, zero resends',export:'local JSON, verified mock values',sourceSha:'PASS',desktop:'PASS',mobile390:'PASS, no horizontal overflow',pageErrors:errors,realWalletSigning:'NOT RUN LIVE',liveRPC:'NOT RUN LIVE'};
 if(errors.length)throw new Error(JSON.stringify(errors));fs.writeFileSync(ROOT+'/BROWSER_MOCK_RESULTS.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));await browser.close();server.kill();
})().catch(async e=>{console.error(e);if(debugPage)console.error((await debugPage.locator('body').innerText()).slice(0,8000));process.exit(1);});
