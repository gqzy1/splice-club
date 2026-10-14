import {useEffect,useState} from 'react';
import {CHAIN,RPC,SOURCE_SHA,DEPLOYMENT_ENABLED,SEEDS,STEPS,isHash,same,stringify,type Step} from './config';
import {connect,configure,discover,walletState,type Choice} from './wallet';
import {Store,evidence,exclusive,nextStep,type State,type Plan} from './store';
import {Operator,errorText} from './engine';
import {readiness} from './rpc';
import {sourceCheck} from './sdk';
const store=new Store(),operator=new Operator(store);
const titles={T01:'Deploy Contract',T02:'Create Seed A',T03:'Create Seed B',T04:'AI Fusion'};
export function App(){
 const [state,setState]=useState<State|null>(null),[error,setError]=useState(''),[choices,setChoices]=useState<Choice[]>([]),[selected,setSelected]=useState(''),[confirmed,setConfirmed]=useState(false),[connected,setConnected]=useState<Choice|null>(null),[account,setAccount]=useState(''),[diagnostic,setDiagnostic]=useState<any>(null),[busy,setBusy]=useState(false),[plan,setPlan]=useState<Plan|null>(null),[ack,setAck]=useState(false),[eA,setEA]=useState(''),[eB,setEB]=useState(''),[interaction,setInteraction]=useState(''),[reviewA,setReviewA]=useState(false),[reviewB,setReviewB]=useState(false),[reviewInteraction,setReviewInteraction]=useState(false),[sourceOK,setSourceOK]=useState(false),[recoveryHash,setRecoveryHash]=useState(''),[recoveryStep,setRecoveryStep]=useState<Step>('T01'),[lastHash,setLastHash]=useState('');
 const refresh=()=>{try{setState(store.load());}catch(e){setError(errorText(e));setState(null);}};
 useEffect(()=>{refresh();sourceCheck().then(()=>setSourceOK(true)).catch(e=>setError(errorText(e)));return discover(setChoices);},[]);
 useEffect(()=>{const fn=()=>{setPlan(null);setAck(false);refresh();};window.addEventListener('storage',fn);return ()=>window.removeEventListener('storage',fn);},[]);
 useEffect(()=>{
  if(!connected)return;
  let alive=true;const update=async()=>{try{const w=await walletState(connected.provider);if(alive){setAccount(w.account);}}catch(e){if(alive){setAccount('');setDiagnostic(null);setError(errorText(e));}}};
  const changed=()=>{setPlan(null);setAck(false);setDiagnostic(null);void update();};
  connected.provider.on?.('accountsChanged',changed);connected.provider.on?.('chainChanged',changed);connected.provider.on?.('disconnect',changed);
  const timer=setInterval(update,2000);void update();
  return ()=>{alive=false;clearInterval(timer);connected.provider.removeListener?.('accountsChanged',changed);connected.provider.removeListener?.('chainChanged',changed);connected.provider.removeListener?.('disconnect',changed);};
 },[connected]);
 async function action(fn:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await fn();}catch(e){setError(errorText(e));}finally{setBusy(false);refresh();}}
 async function connectWallet(){const c=choices.find(c=>c.id===selected);if(!c?.okx||!confirmed)throw new Error('请选择并确认 OKX Provider。');setConnected(c);const w=await connect(c);setAccount(w.account);await diagnose(c);}
 async function diagnose(c=connected){if(!c)throw new Error('WALLET BLOCKED: 请先连接 OKX。');setDiagnostic(null);const d=await readiness(c.provider);await sourceCheck();setDiagnostic(d);await exclusive(async()=>{const s=store.load();s.diagnostic=d;store.save(s);});}
 async function prepare(step:Step){if(!connected)throw new Error('请先连接');setPlan(null);setAck(false);await exclusive(async()=>setPlan(await operator.prepare(connected.provider,step)));}
 async function poll(step:Step){
  // Read-only polling; errors or timeout hold ALL writes. Each click only tracks the saved hash.
  for(let i=0;i<120;i++){
   const result=await exclusive(()=>operator.recheck(step));refresh();if(result==='VERIFIED')return;
   await new Promise(r=>setTimeout(r,2500));
  }
  await exclusive(async()=>{store.stop('READ-ONLY HOLD: 轮询超时，只能查询原 Hash，禁止重发。');});throw new Error('等待超时；请点击“只读重新查询”。');
 }
 async function send(){if(!connected||!plan||!ack)throw new Error('签名条件未满足');const p=plan;setPlan(null);setAck(false);await exclusive(async()=>{const hash=await operator.submit(connected.provider,p);setLastHash(hash);});refresh();await poll(p.step);}
 function download(){if(!state)throw new Error('保存记录不可用。');const content=stringify(evidence(store.load()));const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='SPLICE_V2_EVIDENCE_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();URL.revokeObjectURL(url);}
 const next=state?nextStep(state):null;
 const aNeeded=next==='T02'||next==='T04',bNeeded=next==='T03';
 const accountOK=!!account&&(!aNeeded||same(account,state?.walletA))&&(!bNeeded||!same(account,state?.walletA));
 const ready=diagnostic?.status==='READINESS PASS'&&same(diagnostic.account,account)&&sourceOK;
 const writesAllowed=DEPLOYMENT_ENABLED&&!!state&&!state.halt&&ready&&accountOK&&!busy;
 const child=state?.entries.T04?.reads?.work;
 return <main><header><div className="eyebrow">SPLICE.CLUB / FAST-2G / V2 / LOCAL ONLY</div><h1>SPLICE V2<br/>OPERATOR</h1><p>本机 Chrome + OKX Wallet · 4 笔独立确认 · 仅 Stable Studionet</p></header>
 <div className="notice"><b>AUTHORIZED V2 LOCAL OPERATOR · 总预算 4 笔（含失败） · NOT RUN LIVE</b><p>本批仅授权 T01–T04 各一次本机主动签名，无重试或第5笔。V1 操作台与旧记录保持独立。本包未部署、未签名、未发送交易。页面不会连续发起四笔交易。每次费用必须为 0；钱包弹窗出现非零费用或转账金额，请拒签并停止。不要清理本站存储、换端口或开另一份操作台。</p></div>
 {error&&<div role="alert" className="error">{error}</div>}
 {state?.halt&&<div className="error"><b>WRITES STOPPED</b><p>{state.halt}</p><p>请保留记录并导出证据。这里只允许查询既有 Hash，不提供重试发送或清空进度按钮。</p></div>}
 {lastHash&&<p className="hash">最近返回 Hash：{lastHash}</p>}
 <section><h2>01 / 钱包与环境</h2><label>明确选择钱包 Provider<select value={selected} disabled={!!connected||busy} onChange={e=>{setSelected(e.target.value);setConfirmed(false);}}><option value="">请选择 OKX Wallet</option>{choices.map(c=><option key={c.id} value={c.id} disabled={!c.okx}>{c.name} [{c.rdns}]{c.okx?'':' — 不可使用'}</option>)}</select></label>
 <label className="check"><input type="checkbox" checked={confirmed} disabled={!!connected||busy} onChange={e=>setConfirmed(e.target.checked)}/>我确认上方 Provider 是我的 OKX Wallet；钱包弹窗也必须显示 OKX。</label>
 <div className="buttons"><button disabled={busy||!!account||!confirmed||!choices.find(c=>c.id===selected)?.okx} onClick={()=>void action(connectWallet)}>CONNECT OKX WALLET</button><button disabled={busy||!connected} onClick={()=>void action(async()=>{const w=await configure(connected!.provider);setAccount(w.account);await diagnose();})}>配置 / 切换 61999 网络</button><button disabled={busy||!connected} onClick={()=>void action(()=>diagnose())}>本地只读环境检查</button></div>
 {!choices.length&&<p>WALLET BLOCKED：尚未发现 OKX。请在本机 Chrome 安装、解锁 OKX 扩展，再刷新。不要在云浏览器操作。</p>}
 <dl><dt>固定网络</dt><dd>{CHAIN} / 0xf22f</dd><dt>固定 RPC</dt><dd>{RPC}</dd><dt>当前账户</dt><dd>{account||'NOT CONNECTED'}</dd><dt>钱包 A</dt><dd>{state?.walletA||'T01 签名前固定'}</dd><dt>钱包 B</dt><dd>{state?.walletB||'T03 签名前固定，必须不同于 A'}</dd><dt>源码校验</dt><dd>{sourceOK?'SHA256 PASS':'NOT VERIFIED'}<br/>{SOURCE_SHA}</dd><dt>环境</dt><dd>{ready?'READINESS PASS':'NOT READY'}{diagnostic&&<pre>{stringify(diagnostic)}</pre>}</dd></dl>
 <p className="muted">EIP-1193 无法读取钱包保存的 RPC URL；添加网络的参数只允许官方 RPC，交易前独立检查钱包和官方 RPC 的链 ID、余额、费率和估费。无法连接时停止。</p></section>
 <section><h2>02 / 四步链上验收</h2><p>准备交易只执行只读检查；显示完整参数后，独立点击签名按钮。预检有效期 60 秒。任何拒签、估费错误、非零费用或广播未知都会停止。</p>
 {bNeeded&&<div className="switch"><b>SWITCH TO WALLET B</b><p>打开 OKX 扩展 → 点击顶部账户名称 → 选择另一个可签名账户。页面会自动重新读取地址。B 必须与 A 不同，然后点击本地只读环境检查。</p></div>}
 {aNeeded&&!same(account,state?.walletA)&&<div className="switch"><b>SWITCH BACK TO WALLET A</b><p>在 OKX 中切回上方记录的原始 A 地址，然后点击本地只读环境检查。</p></div>}
 {STEPS.map(step=>{const e=state?.entries[step];return <article key={step}><div className="row"><h3>{step} — {titles[step]}</h3><span>{e?.status||'NOT RUN'}</span></div><p>{step==='T01'?'A 部署完整官方源码；空构造参数 []；leaderOnly=false。':step==='T04'?'A 使用两个已经读回的真实父作品 ID；leaderOnly=false。':`${step==='T02'?'A':'B'} 创建固定种子；allow_derivation=true；leaderOnly=false。`}</p>
 {(step==='T02'||step==='T03')&&<details><summary>查看批准的种子输入</summary><pre>{stringify({...SEEDS[step],allow_derivation:true})}</pre></details>}
 <p className="hash">{e?.hash||'Hash: NOT RUN'}</p>{e?.reads?.work&&<pre>{stringify(e.reads.work)}</pre>}
 <div className="buttons"><button disabled={!writesAllowed||next!==step||!!e} onClick={()=>void action(()=>prepare(step))}>准备 {step}（只读）</button><button disabled={busy||!e?.hash} onClick={()=>void action(()=>poll(step))}>只读重新查询</button></div>
 {e?.raw&&<details><summary>实际链上响应 / 读取 / 费用</summary><pre>{stringify(e)}</pre></details>}</article>;})}
 {plan&&<div className="preview"><h3>待签名：{plan.step}</h3><p>Gas / Gas Price / 预计费用见以下真实预检值。所有内容公开上链。</p><pre>{stringify(plan)}</pre><label className="check"><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>我已核对账户、61999、value=0、预计费用=0；若钱包弹窗不一致，拒签并停止。</label><button disabled={busy||!ack||!writesAllowed||!same(account,plan.account)} onClick={()=>void action(send)}>SIGN {plan.step} IN OKX — 仅此一笔</button></div>}
 {busy&&<p aria-live="polite">正在执行当前操作 / 等待钱包或共识。不会自动发起下一笔写入。</p>}</section>
 {child&&<section><h2>03 / 核对真实 AI 融合</h2><p>链上结果及谱系已读回。请对照下方双方源特征，检查实际描述与三个特征是否保留双方属性，并形成组合机制。这一步不发送交易。</p><div className="parents">{(['T02','T03'] as const).map(k=><pre key={k}>{stringify(state?.entries[k]?.reads.work)}</pre>)}</div><pre>{stringify(child)}</pre><label className="check"><input type="checkbox" checked={reviewA} onChange={e=>setReviewA(e.target.checked)}/>我已对照真实父作品，确认保留 A 的独特核心特征。</label><label className="check"><input type="checkbox" checked={reviewB} onChange={e=>setReviewB(e.target.checked)}/>我已对照真实父作品，确认保留 B 的独特核心特征。</label><label className="check"><input type="checkbox" checked={reviewInteraction} onChange={e=>setReviewInteraction(e.target.checked)}/>我确认真实描述和特征形成了组合机制。</label><details><summary>可选：记录真实原文证据</summary><label>保留 A 特征的真实原文片段<input value={eA} onChange={e=>setEA(e.target.value)}/></label><label>保留 B 特征的真实原文片段<input value={eB} onChange={e=>setEB(e.target.value)}/></label><label>组合机制的真实原文片段<input value={interaction} onChange={e=>setInteraction(e.target.value)}/></label></details><button disabled={busy||!!state?.halt||!reviewA||!reviewB||!reviewInteraction} onClick={()=>void action(()=>exclusive(async()=>operator.semantic(eA,eB,interaction,true)))}>确认语义证据（只读、本地保存）</button></section>}
 <section><h2>04 / 证据与恢复</h2><p className="status">{state?evidence(state).status:'STORAGE BLOCKED'}</p><button disabled={busy||!state} onClick={()=>void action(async()=>download())}>EXPORT EVIDENCE</button><p>导出 JSON 只保存到本机下载目录；包含公开钱包地址和链上原始结果，请自行决定是否分享。不会自动上传 GitHub。</p>
 <details><summary>钱包已有 Hash，但页面未收到 / 未保存</summary><p>只可给已保存、尚无 Hash 的 intent 补录钱包交易历史里的真实 Hash；不构造或发送新交易。核验 from、nonce、目标和输入后才允许恢复进度。若没有保存的 intent，停止并保留钱包历史，由人工调查。</p><select value={recoveryStep} onChange={e=>setRecoveryStep(e.target.value as Step)}>{STEPS.map(k=><option key={k}>{k}</option>)}</select><input placeholder="钱包历史中的真实 0x Hash" value={recoveryHash} onChange={e=>setRecoveryHash(e.target.value)}/><button disabled={busy||!isHash(recoveryHash)} onClick={()=>void action(()=>exclusive(async()=>operator.recoverHash(recoveryStep,recoveryHash)))}>补录 Hash（只读，不重发）</button></details>
 <p className="muted">使用固定 http://127.0.0.1:4180。Web Locks 防止同源标签页同时签名；localStorage 保存进度。浏览器清理站点数据、切换 Chrome 配置、复制至不同源或手工改文件会破坏本地保护边界，请停止并调查，勿从头执行。</p></section>
 <footer>工具链 genlayer-js 1.1.8 · 合约 runner pin 保持冻结 · 节点运行中精确 GenVM 版本 NOT VERIFIED<br/>无私钥输入 · 无助记词读取 · 无自动重发 · 无远程证据上传</footer></main>;
}
