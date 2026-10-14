# SPLICE.CLUB — FAST-2C OKX 本地操作台交付报告

日期：2026-10-14。交付状态：**LOCAL OPERATOR READY FOR USER CHECK / NOT RUN LIVE**。

本轮真实链上写入 **0/4**，真人钱包签名 **0 次**，未部署合约，没有真实 SPLICE 融合结果。Mock 测试不计入链上交易额度。

## A / GitHub 检查点

- 账号：gqzy1；Repository B：https://github.com/gqzy1/splice-club
- 工作分支：`fast-2c-okx-local-operator`。
- 基线：`6b5b546ef9e3265f5164d58af4bb6684ef6ff74f`，已包含 FAST-2A 安全修复 `4430d903fbf2ee9fd19ee694ddd72da315381412`。
- 实际交付 Commit：见本报告所在分支提交；用户收到的独立交付报告附完整 SHA。
- 本轮仅新增 `local-operator/` 与本报告，原前端源码、业务逻辑、网络配置未变。
- 启动前与交付前核对远程：A main=`03986aa00920ccc3474a8a0f88f768b073dfe066`；B main=`debf2e5d740658a494d30981652007341a53401f`；gh-pages=`10e5089d0067b38929a066f511f036c2310e8389`。

## B / Draft PR 与依赖

FAST-2C Draft PR 以 `fast-2b-real-onchain-e2e` 为 base，不直接合入 main。依赖链：PR #1 → PR #2 → PR #3 → FAST-2C。现有三个 PR 均保留 open/draft，未合并。实际新 PR URL 随最终交付提供。

## C / 完整本地启动包

`SPLICE_FAST2C_OKX_OPERATOR.zip`，根目录 `SPLICE_FAST2C_OKX_OPERATOR/`。

包含：完整 React/TypeScript 源码、精确版本 package/lockfile、冻结官方合约、预构建 dist、Windows 启动及校验脚本、中文说明、安全设计、43 项测试、mock 浏览器验收结果、完整交付文件 SHA256 清单。无 node_modules、私钥、账户配置、真实钱包记录或伪造链上成功证据。

如附件不可下载，打开分支 https://github.com/gqzy1/splice-club/tree/fast-2c-okx-local-operator ，Code → Download ZIP → 全部解压 → 进入 `local-operator` → 双击启动脚本。GitHub 源码下载不含预构建 dist，脚本会用锁定依赖本地构建。最终附件已包含预构建，不要求用户编辑源码。

## D / Windows 启动

下载 → 全部解压 → 双击 `START_SPLICE_LOCAL.cmd` → Chrome 打开 `http://127.0.0.1:4179`。

脚本检查 Node.js ≥22.12；没有 Node 时只给官方 https://nodejs.org/ LTS 安装指引。依赖缺失时执行 `npm ci --ignore-scripts --no-audit --no-fund`；已有依赖与构建时直接启动。绑定 127.0.0.1 固定端口，优先从标准 Windows 安装目录启动 Chrome，不运行远程启动脚本，不自动发交易。若 Chrome 不在标准目录，手动用已有 OKX 的 Chrome 打开显示的本地 URL。

首次依赖安装需要用户本机访问 npm 官方包源；失败则停止并显示错误，不切换未知镜像。Windows shell 实际执行与 Chrome 扩展未能在本轮 Linux 环境真人验证，明确 NOT RUN ON WINDOWS。

## E / OKX 与账户切换

不使用 window.ethereum 作为默认钱包。支持 EIP-6963 明确列出钱包，以及官方 `window.okxwallet` + isOkxWallet 检测。非 OKX 选择禁用；所有选择需用户明确确认；同时有 MetaMask 不会静默改用它。

连接账户 A → T01 部署 → T02 Prism Beetle → 在 OKX 账户菜单切到 B → 环境检查 → T03 Echo Loom → 切回原 A → 环境检查 → T04 融合。

页面自动读取账户事件并以 2 秒只读轮询补充；每次准备和签名前重新检查当前公开地址与 chain ID。B!=A；T04 必须原始 A。网络添加/切换只在用户点击网络按钮后触发；4902 才请求添加固定 Stable 网络。没有扩展或不兼容时停止，不换签名工具。

## F / 本地 RPC 诊断

浏览器直接访问官方 RPC，独立核查钱包 RPC 的链 ID、余额、费率和估费。每次写入前真实执行 eth_chainId、eth_accounts、eth_getBalance、eth_gasPrice、eth_estimateGas；同时检查 pending nonce 与 SDK 只读构造请求。

可显示 NETWORK BLOCKED / WALLET BLOCKED / SIGNING BLOCKED / RPC UNSUPPORTED / READINESS PASS。HTTP403 明确展示；CORS/网络/超时在浏览器无法可靠区分时诚实列可能原因。没有云端重复 POST、替代网络或第三方 RPC。

EIP-1193 无法反查钱包保存的 RPC URL，操作台不能声称已经证明钱包内部设置。添加/切换参数固定，双路径检查实际响应；中文说明提示在 OKX 核对 RPC URL。

## G / 独立部署入口与发送保护

部署前没有 SPLICE 地址。操作台独立调用 genlayer-js 1.1.8 的 deployContract 构造完整源码、空构造参数和 leaderOnly=false；内部 recipient 为 SDK 部署零地址，外层为 SDK 固定共识入口。

SDK 仅拿到 capture-only provider。构造到发送边界时拦截并抛出异常，不伪造 Hash，不交给真实钱包。签名前重新构造并逐项比对。随后由单一独立路径调用已选 OKX 的 eth_sendTransaction **一次**。SDK 内部 200000 gas fallback 与 ABI fallback 无法接触真实钱包。

预检与签名前双路径估费；任何估费失败、非零 gasPrice/value、账户/网络/nonce/参数改变即停止。预检有效 60 秒。钱包弹窗若显示非零费用或转账金额，用户拒签并停止。

## H / T01–T04 实际参数来源

| 阶段 | 来源与读取条件 |
|---|---|
| T01 | `local-operator/contracts/creative_fusion.py` 完整冻结字节；构造参数 []；A；leaderOnly=false。签名前展示来源 SHA、from/to/data/value、Gas、Gas Price、预计费用。 |
| T02 | config.ts 中已批准 Prism Beetle 名称、描述、两个 features、creature、true，crypto.randomUUID 请求 ID；A 签名；get_request→get_work 验证实际 ID 与内容。 |
| T03 | config.ts 中已批准 Echo Loom 名称、描述、两个 features、object、true，唯一请求 ID；B 签名；核对不同 creator 与实际 ID。 |
| T04 | 仅从 T02/T03 已验证读取中取得 ID，不预设 1/2；A 调用 fuse(idA,idB,request_id)，leaderOnly=false。 |

所有源参数可在页面展开核对；每笔真实 SDK 编码的 calldata、账户、nonce 和 request_id 在签名前持久化，返回 Hash 后立即保存。之后仅查询同 Hash。

## I / 安全与实际测试结果

- 操作台 **43/43 MOCK PASS**；TypeScript 与生产构建 PASS。
- 原项目 **45/45 PASS**；类型检查 PASS；没有更改原前端。
- 独立 lockfile 的全新 `npm ci --ignore-scripts` PASS。
- 隔离 Chromium mock 跑通 T01→T04、A→B→A、实际 mock 返回 ID 11/27/42、语义门槛、刷新不重发、本地 JSON 导出；无页面错误，桌面及 390px 移动布局无横向溢出。ID 是测试夹具，绝不作为真实证据。
- 本地 HTTP GET 200；POST/外部 Origin/外部 Host 403。此为 LOCAL READ-ONLY VERIFIED 的本地服务测试，不是 Stable 链上读取。
- 17 项要求逐项覆盖见 `local-operator/SAFETY_TEST_RESULTS.md`。额外覆盖存储在签名前/返回 Hash 后异常、nonce/calldata 替换、SDK 参数篡改、HTTP403 与敏感字段脱敏。
- 跨标签页 Web Locks 排他锁 + 锁内复读阶段；持久化失败即禁止签名；无 Hash 保留 UNKNOWN；拒签、明确共识失败、非零费用不重试。
- 复用官方 Studio 源码核对字段结构，不把参考仓库最新提交当成线上节点版本。未知真实字段会停止。

## J / A/B/操作台源码一致

A `contracts/creative_fusion.py`、B `intelligent-contract/contracts/creative_fusion.py`、本地操作台 `contracts/creative_fusion.py`，均 **9594 字节，逐字节一致**：

`cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`

A 官方源码只读拉取比对，没有修改；B 原文件无 diff；本轮未调整源码、runner pin 或 SHA。

## K / 已知限制与兼容性风险

1. Windows .cmd、实际 Chrome/OKX、Stable CORS/RPC、真人签名与共识没有运行。Linux mock 不能替代它们。
2. 本机若仍遇 HTTP403/CORS、钱包不支持该 Stable 网络或 RPC 方法不兼容，安全停止；不保证本机一定成功。
3. Web Locks / localStorage 作用域为同源、同 Chrome 配置。清除存储、换端口/配置、手改代码或记录会破坏本地限额保护；工具不提供重置入口，必须先人工对账。
4. 数据写入异常或浏览器在钱包返回前关闭仍可能有 Hash 缺失窗口。已有 intent 支持补录真实 Hash并只读核验；没有 intent 则停止人工调查，禁止从头重发。
5. 所有真实节点精确 GenVM 二进制版本 NOT VERIFIED；genlayer-test 0.29.2 / GenVM v0.2.16 沿用 FAST-2A 历史准备结果，本轮未重跑 VM 测试。
6. 真实创意语义不能仅由关键词匹配证明。页面显示两父作品、实际融合描述/三个特征及 bridge，用户逐项确认，支持可选原文记录。该人工比较与真实链上共识分开导出。
7. 现有 SDK 大文件构建提示保留，未引入无关重构。

## L / 真实结果与证据导出

终态必须同时满足 FINALIZED、明确的 MAJORITY_AGREE、明确成功执行，以及真实读取与零费用。保留返回的实际字段，不补造验证者人数、轮数或 SUCCESS 标签。

部署后核对链上源码 SHA 与 total=0。种子核对 get_request/get_work、creator、内容和请求指纹。融合核对 child、排序 parents、parent_creators、Python canonical ensure_ascii 的 parent_hashes/input_hash/请求指纹、get_lineage、total=3 及 list_works。

完成客观核验后，再经用户对真实生成结果作三项语义确认，才显示 REAL ONCHAIN FUSION VERIFIED。共识失败不保存模拟作品。

EXPORT EVIDENCE 下载本地 JSON，包含网络、来源 SHA、实际地址/A/B、每笔 Hash、原始共识与 SDK 结果、作品和谱系、Gas 回执/实际费用、完成状态与未验证项。未执行步骤为 NOT RUN。意外 RPC 元数据中的明确凭据字段递归脱敏；没有凭据输入、私钥读取或自动上传功能。

## M / 当前真实交易未验证事项

真实 OKX 授权、账户地址/余额、当前费用、部署地址、T01–T04 Hash、实际共识和 AI 输出、链上 get_work/get_lineage、实际费用均 **NOT RUN LIVE**。当前没有“正式上线 READY”结论。

## N / 用户下一步

仅需下载 ZIP → 解压 → 双击启动 → 在本机 Chrome 连接 OKX → 按页面逐笔准备和签名 → 两次 A/B 切换 → 核对真实融合 → EXPORT EVIDENCE。

**若任何一步失败、拒签、状态未知或非零费用，保留记录并停止。不要追加第 5 笔。** 无需修改源码、配置私钥、安装 Python或手打 RPC 命令。

本轮停止于代码、测试、打包、独立 Draft PR 交付。没有合并、公开发布、覆盖试玩、Portal 提交或链上写入。

后续证据核验推荐：GPT-6.1 Sol，思考强度：高（最低建议）。
