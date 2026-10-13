# SPLICE.CLUB — FAST-2A 部署前检查与 FAST-2B 交接

检查时间：2026-10-14（Asia/Shanghai）。本轮链上写入、部署、签名均为 0。未合并 PR、未覆盖公开试玩、未提交 Portal。以下 GO 仅指准备检查通过，不代表部署成功或已授权交易。

## A. 双仓库真实状态

| 对象 | 本轮核实基线 | 状态 |
|---|---|---|
| A：gqzy1/splice-fusion-primitive main | 03986aa00920ccc3474a8a0f88f768b073dfe066 | public；未修改 |
| B：gqzy1/splice-club main | debf2e5d740658a494d30981652007341a53401f | public；未修改 |
| B：fast-1b-playground-experience | f0761c29a8511575506d45564439982bcae6fa88 | FAST-1C 后增加 FAST-1D 预览隔离；本轮修复以此为父版本 |
| B：gh-pages | 10e5089d0067b38929a066f511f036c2310e8389 | 已发布的独立静态离线试玩；未修改 |
| PR #1 | https://github.com/gqzy1/splice-club/pull/1 | open、draft、未合并；最终查询 mergeable=true |

首次 API 查询 mergeable=false；后续查询和本地 merge-tree 均显示可合并，不能据首次暂态值认定存在冲突。现有 PR 保持原状。独立安全修复 PR 以开发分支为 base，不直接把旧版 main 前端用于正式部署。

## B. 正式源码完整性

A：contracts/creative_fusion.py；B：intelligent-contract/contracts/creative_fusion.py。

两份源码逐字节相同，SHA256 均为：

`cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`

构造函数无参数。create_seed(name, description, features, category, allow_derivation, request_id)；fuse(parent_a, parent_b, request_id)；get_work(work_id)、get_lineage(work_id)、get_request(creator, request_id)、list_works(start,limit)、total() 均存在，当前 Stable schema 成功返回且标注读写属性。

Leader 实际调用 exec_prompt 生成结构化候选；Validator 各自对父作品与候选发起语义审查，四项布尔条件及证据格式均须通过。通过 run_nondet_unsafe 后才保存作品；共识前无业务存储写入。两父作品只能为深度 0 的 seed，创作者必须不同，公开派生许可必须为 PUBLIC-DERIVATION-V1。

31/31 原有测试实际重新运行通过（genlayer-test 0.29.2，direct 模式，SDK v0.2.16）。LLM 与共识为 mock，不是链上证据。测试插件打印默认 localnet 配置，但这些测试只调用 direct_vm/direct_deploy，在内存中设 chain_id=61999；没有启动、访问或部署 Localnet。本轮运行用了 108.54 秒，主要包含首次 SDK 装载。

## C. 前端、教程和预览隔离

FAST-1D 将 `VITE_OFFCHAIN_PREVIEW==='true'` 编译进预览，App 层阻断连接钱包、图库读取、详情读取、写入及 pending 恢复。隔离测试以已有 pending、已部署配置和 ?w=1 为条件，仍验证所有链路径未调用。公开网站实际打开后显示 OFFCHAIN PLAY PREVIEW / NO WALLET / NO TRANSACTIONS 和 Tutorial step 1 of 7。未操作其钱包或交易。

正式构建用 `npm run build`，不得设置 VITE_OFFCHAIN_PREVIEW=true；预览构建须显式设置该变量为 true。当前 DEPLOYMENT 仍为 address=null、verifiedWorkId=null、status=NOT_DEPLOYED。正式构建当前只具备调用路径，尚未激活作品注册与融合。

教程使用本地玩法和独立示例，不注入真实图库；保留首次访问、重开、完成记忆、拖拽/点选、跳过动画和谱系互动。当前发布的是 gh-pages 静态产物，不会因本轮开发分支或 Draft PR 自动改变。

修复前：42/42（原 41 加 FAST-1D 隔离测试）；修复后：45/45。npm run check、verify-source、build 全通过。SDK 分块约 535 kB 的构建提示仍存在，不影响本轮准备验收，不进行无关重构。本轮没有重跑上一阶段完整视觉脚本或声称完成真实钱包浏览器 E2E。

## D. Stable RPC 与 SDK 核验

唯一 RPC：https://studio.genlayer.com/api；链 61999（十六进制 0xf22f）。

| 检查 | 结果与证据边界 |
|---|---|
| SDK 实装 | package-lock + npm ci；genlayer-js 精确 1.1.8 |
| eth_chainId | 实际返回 0xf22f / 61999 |
| eth_blockNumber | 实际返回 0x6ace9470；仅证明此 RPC 方法有响应，不作为业务区块高度解释 |
| getContractSchemaForCode | 实际 READ_ONLY_SCHEMA_PASS；完整结果在 STABLE_COMPATIBILITY.json |
| eth_gasPrice | 实际 0x0；不保证下一轮收费策略不变 |
| web3_clientVersion | -32601 Method not found；未盲目重试；运行中 GenVM 精确版本 NOT VERIFIED |
| 官方 v0.2.16 release | GitHub release 存在，prerelease=false；已核对官方元数据 |
| runner pin | 与官方 first-contract 文档所列 pin 一致；schema 实测可解析；不等于证明所有运行中节点二进制版本 |
| 浏览器 SDK 网络 | studionet.id=61999、isStudio=true；支持 EIP-1193 provider |
| readContract | SDK 使用 gen_call；正式路径改用 latest-final 读取；目标合约未部署，真实作品读取 NOT VERIFIED |
| deployContract | SDK 可构造源码字节 + 空构造参数，leaderOnly=false；源码与类型层验证，未调用发送 |
| writeContract | 已接入 create_seed/fuse；leaderOnly=false，value=0n |
| getTransaction / receipt | SDK Studionet 查询及解码路径已检查；尚无本项目真实 Hash，现场状态兼容性 NOT VERIFIED |

当前 SDK studionet 的 consensusMainContract 为 0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575；这是网络共识入口，绝不是 SPLICE 合约地址。defaultConsensusMaxRotations=3；不能据此推断实际轮数或验证者数量。

官方参考：
- https://docs.genlayer.com/developers/intelligent-contracts/first-contract
- https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio
- https://github.com/genlayerlabs/genvm/releases/tag/v0.2.16
- 当前安装 genlayer-js 1.1.8 的 dist/index.js、types 和 studionet 配置为本轮 SDK 方法依据；不把最新文档的新 API 强行套到固定版本。

## E. 浏览器钱包条件

Stable Studio 页面可打开，显示一个缩写内置账户；没有把它认定为用户真实钱包，也没有查看私钥或用它写入。用户浏览器的 OKX/MetaMask 扩展、授权账户 A/B、余额、签名请求及拒签流程均 NOT VERIFIED。Work 云浏览器不自动拥有用户 Windows Chrome 的钱包。

下一阶段须在用户可自主确认的钱包浏览器环境验证两个不同地址。只记录公开地址，不索取私钥、助记词。钱包新增网络参数：chainId=0xf22f；chainName=GenLayer Studionet；nativeCurrency={name:GEN,symbol:GEN,decimals:18}；rpcUrls=[https://studio.genlayer.com/api]。先 switch；仅错误 4902 时 add 后再 switch；每次签名前重新读 eth_chainId 和 eth_accounts。

目前优先 window.ethereum；多钱包同时注入时，须确认实际选中的 provider，不声称已支持完整 EIP-6963 选择器。批准交易前应确认哪个浏览器能由用户亲自确认；云浏览器若无真实钱包，STOP，不能以 Studio 自建身份替代。

## F. T01–T04 有界执行计划

建议后续批准写入总上限为 4 笔，包含失败/重试；成功路径也是 4 笔。任意提交后结果不明立即停止新增写入，仅重查。失败不能在本上限之外自动重试。所有读查询无需交易。

| 编号 | 钱包与操作 | 完成条件 |
|---|---|---|
| T01 | A 部署 exact canonical source；空构造参数；leaderOnly=false | 原始 Hash、状态、执行结果、真实合约地址可核对；schema 与源码复核；total()==0 |
| T02 | A create_seed 下列种子 A；明确 true 公开派生 | 成功终态后 get_request(A,ridA) 返回真实 idA；get_work(idA) 的 creator=A |
| T03 | B create_seed 下列种子 B；B!=A；明确 true | 成功终态后读出 idB、creator=B；不得假定 idB=2 |
| T04 | A fuse(idA,idB,ridFusion)；两个 seed 已成功 | 实际共识通过、执行成功；读出 child、get_lineage(child)、两父作品 |

预备原创输入（ASCII，遵守长度及格式；不冒充已经登记）：

种子 A：name=`Prism Beetle`；category=`creature`；description=`A small beetle refracts moonlight through its prismatic shell. Its antennae sense rhythms and steer each colored beam to match the beat.`；features=[`prismatic shell refracts moonlight`,`antennae sense rhythms`]；allow_derivation=true。

种子 B：name=`Echo Loom`；category=`object`；description=`A portable loom weaves audible tones into threads. Each woven thread stores a vibration and releases its sound when a beam of light touches it.`；features=[`weaves tones into threads`,`light releases stored vibrations`]；allow_derivation=true。

每次操作生成独立 UUID request_id（长度 8–64，字母数字/短横/下划线），在签名前归档。使用同一 sender、同一 request_id 和完全相同规范化 payload 时合约返回既有 ID；不同 payload 引发 REQUEST_CONFLICT。request_id 不跨钱包共享去重，不能用换钱包绕过恢复调查。

T01 使用浏览器钱包 SDK client.deployContract({code:Uint8Array(exact source bytes),args:[],leaderOnly:false})；不得使用本地私钥账户。当前 App 无部署界面且 address() 未部署时阻断，部署须使用单独的受控执行入口：沿用本轮签名前检查、单次发送保护、即时保存 Hash 和未返回 Hash 的持久化记录，并预先归档部署源码/账户/nonce。不能为调用本 App guardedProvider 而填入虚假 SPLICE 地址。

T02–T04 在受控的正式构建上执行；不得对公开 OFFCHAIN PREVIEW 解禁。部署后临时受控执行配置不等于公开正式激活。实际钱包账户、余额和 nonce 具备后才可只读构造/估费；本轮没有以伪造账户完成估费。

## G. 真实共识验收

为每笔交易保存：chainId、RPC、UTC 时间、源码 SHA256、发送钱包、操作与参数、request_id、Hash、完整原始查询响应、SDK 解码响应和 Explorer 证明入口。保留实际字段名称，禁止把 FINISHED_WITH_RETURN 随意改写为网络原生 SUCCESS。

当前前端接受 FINALIZED + MAJORITY_AGREE + FINISHED_WITH_RETURN（或固定 SDK 对应数值 7/6/1），并进一步读取保存作品；若 Stable 实际字段不同，先归档原始响应并核查语义，不硬套成功标签。Leader、Validators、votes、rounds、rotation 只在响应实际提供时记录，不可补造人数。

T04 成功证据必须同时满足：
1. 真实交易达到成功终态；没有 contract/GenVM error。
2. get_request(A,ridFusion)>0，get_work(child) 为 fusion、depth=1、creator=A。
3. parents 等于排序后的 [idA,idB]；parent_creators 对应两个不同真实钱包；两父作品均 seed、depth=0、PUBLIC-DERIVATION-V1。
4. get_lineage(child).work 与 get_work(child) 相同；parents 返回两份完整父作品。
5. 从原始父作品按合约 canonical（sort_keys=True、ensure_ascii=True、紧凑 JSON）重算 parent_hashes；构造 {version:SPLICE-V1,parents:[...]} 重算 input_hash；全部一致。
6. 候选 name/description/3 个 features/bridge 符合正式限制，实际保留双方特征且形成组合机制；不得替换为本地教程预设结果。
7. total、list_works 和 child 保存一致；在没有其他写入的受控验收中应共 3 件作品。原始完整数据可追溯。

共识失败不展示“正式新作品”；先只读比较 total/get_request，保留失败证明。不能因 UI 动画结束、ACCEPTED 或轮询超时就宣称成功。

## H. 费用和恢复保护

预算：现金 0；仅免费测试 GEN，不购买 GEN、不用付费 API。当前 eth_gasPrice=0，不据此承诺整个未来流程永远免费。签名前以真实 from/to/data/value 调 eth_estimateGas、eth_gasPrice、eth_getBalance；确认钱包显示及余额。四笔预计 gas费用仅在价格持续 0 时为 0 GEN；实际 gas、钱包余额和总费用未完成预估。若出现非零 fee/value 或需要新费用机制，本方案停止并重新决定预算，不调用 sim_getFeeConfig。

SDK 1.1.8 默认估费失败可回退 200000 gas，且存在 addTransaction ABI fallback。本轮在 B 加入 wallet boundary guard：实际发送前再估费，失败不弹出发送；网络/账户再核对；0 fee/value 限制；同一 guard 最多一次 eth_sendTransaction；先持久化 intent，钱包返回 Hash 后立即保存 pending；未知响应不清掉 intent且阻止新写入；4001 明确拒签才清除未知记录。

已知 Hash 轮询超时保留 pending，刷新后“Recheck saved transaction”只读恢复，不发送。pending 新增 contract/chainId，用于阻止跨部署恢复；历史未带 scope 的旧 pending 仍需人工核实，正式激活前不得带入旧记录。未知 Hash 时查看钱包交易历史、公开账户/nonce 和保存 request_id，只读 get_request；没有确定排除已提交前不得删除 intent 后重签。若发现已成功但 Hash 丢失，先找到实际 Hash 再归档。存储写入异常、浏览器关闭在签名返回之前、用户清理存储仍可能需要钱包历史恢复，不能承诺绝无窗口。

FAST-2B 只使用一个交易页/浏览器标签；当前 busy/flight 是页内保护，不声称完成跨标签原子锁。禁止并行签名、换账户重发、自动 appeal/cancel/faucet 或追加失败测试。

## I. 最小修复结果与边界

仅 B 前端 adapter、错误提示、对应 mock/安全测试、只读证据更新。合约规则、官方源码、地址配置、教程、公开 gh-pages 均未修改。新增 3 项安全测试验证未知发送禁止 SDK fallback、Hash 边界持久化、估费失败/非零价禁止签名。45/45；类型/构建/源校验通过。真实签名尚未运行，mock 不替代它。

## J. GO / BLOCKED / NOT VERIFIED

| 结论 | 项目 |
|---|---|
| GO（准备） | A/B 源码、31 项 direct 测试、45 项前端测试、Stable 连通性/schema、SDK 固定版本、预览隔离、修复 Draft 交付 |
| BLOCKED（执行门槛） | 尚无 FAST-2B 授权；尚未验证两个可由用户亲自确认的真实钱包；不允许现在执行任何写入 |
| NOT VERIFIED | 真钱包连接/余额/签名、目标部署、真实 getTransaction 终态字段、GenVM 全节点精确二进制版本、LLM 共识成功、目标作品读取及谱系、实际费用 |

最终：部署前准备完成；条件性 GO；不能宣称真实 E2E 或正式上线 READY。

## K. 下一阶段需批准范围

建议用户在新的 Work 窗口明确授权：Stable Studionet 上最多 4 笔写入（T01–T04，含失败）；两真实钱包公开地址核对、用户亲自确认签名；受控正式构建 E2E 与真实证据归档。失败/未知状态/非零费用立即 STOP；额外重试另行授权。此报告本身不是授权。

PR 合并、公开生产激活与 A 仓库部署文档更新是否包含在 FAST-2B 必须显式界定，不能把交易批准自动扩展为所有发布行为。本轮不要求用户现在点击钱包。

## L. FAST-2B 自包含交接

使用 GitHub gqzy1。A=https://github.com/gqzy1/splice-fusion-primitive；B=https://github.com/gqzy1/splice-club。固定 A main=03986aa00920ccc3474a8a0f88f768b073dfe066；B main=debf2e5d740658a494d30981652007341a53401f；开发基线=f0761c29a8511575506d45564439982bcae6fa88；gh-pages=10e5089d0067b38929a066f511f036c2310e8389。先读取本报告和独立安全 PR，再核对所有远程 SHA；本轮修复未合并，不能误用旧 adapter。

唯一网络 Chain 61999/RPC https://studio.genlayer.com/api；genlayer-js=1.1.8、genlayer-test=0.29.2、GenVM SDK=v0.2.16；canonical SHA256=cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e。禁止 Bradbury、studio-dev、Localnet、私钥、收费 API、sim_getFeeConfig、无授权合约修改。

只有收到新的明确交易授权并验证钱包环境才执行 F 节 T01–T04；每笔保存 Hash 后等待，读取确认才进入下一笔；总发送次数含失败不超过批准上限。融合不成功不得上线 Verified example，不改合约绕过 Validator。遇到 canonical 源码必须修改立即 STOP。

若全部成功且另有生产激活授权，才执行：真实 address/status/verifiedWorkId 配置；正式构建不设置预览 true；保留七步教程；展示真实图库和融合；保存预览静态构建供独立访问并明确不同权限/存储范围（localStorage 同源共享，须先核对 pending scope）；更新完整 Manifest、源码 provenance 和 T01–T04 原始证据；真实浏览器验收；A/B 文档与双赛道提交准备。不得自行 Portal 提交。公开切换发布需要先明确预览保留 URL/路径，不能在本轮覆盖 gh-pages。

推荐执行模型：GPT-6.1 Sol；强度：高（最低建议）。
