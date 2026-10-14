# SPLICE.CLUB FAST-2D — 真实 AI 融合失败取证报告

日期：2026-10-14。账号：gqzy1。**最终决策：NOT VERIFIED。暂不建议消耗新的链上写入额度。**

已经确认三轮 Leader 的 JSON 解析失败，以及另一轮候选通过本地执行后遭到验证分歧。但原始失败模型文本和各 Validator 的评审文本未被保存，不能可靠区分第三轮的格式假拒绝、语义拒绝或被捕获异常，也不能确定三轮解析失败的具体包装形式。已证明一个最小格式候选的局部作用；未证明它能解决本次事故或提升真实共识成功率。

## 1. 范围与证据完整性

- 网络仅 Stable Studionet，Chain ID 61999，RPC `https://studio.genlayer.com/api`。
- 已部署地址：`0x49FA79fB4Ff5C924F9FbA0a2E16558E3A7Db8D38`。
- 完整读取 1,097,234 字节原始 JSON；程序校验文件 SHA256 为 `6774364407af551852dab89ad891eda73e83eeaa21ffe4da2f13dcd167f15abe`。
- 从 T01 `raw.data.contract_code` 解码部署源码，SHA256 为 `cf1a92bd0956baf2cad0f54a7d8a677c312156fa9f54188b51a5b240190ffe8e`。
- GitHub 插件确认当前账户为 gqzy1；Repository A main 仍为 `03986aa00920ccc3474a8a0f88f768b073dfe066`，该提交的官方源码独立读取后哈希相同。
- Repository B `fast-2c-okx-local-operator` 仍为 `eb8e076b1936ce98828d350f932310c678161a09`；开始时 main 为 `debf2e5d740658a494d30981652007341a53401f`。诊断从 FAST-2C 分支建立，不覆盖 main。
- B 官方副本和本地操作台合约副本哈希均相同，均未修改；Manifest、旧证据及公网试玩站未修改。
- 原始大型证据仅在本地解析；未上传 GitHub 或其他外部服务。公开交付仅含白名单字段摘要、第三轮候选、最小父作品内容及诊断代码。

证据定位采用 JSON Pointer。四轮位于 `/steps/T04/raw/consensus_history/consensus_results/0..3`。机器摘要见 `evidence_summary.json`；真实候选见 `captured_round3.json`。

## 2. T01–T04 的真实结果

| 交易 | 实际哈希 | 导出时结果 | 已有读取证据 |
| --- | --- | --- | --- |
| T01 部署 | `0x20353ba0b03074894268e3d9422b6fdaff3bc34fbe18e11e3c9b9bc1e1e096ca` | FINALIZED / MAJORITY_AGREE | 合约地址、源码 SHA、total=0 |
| T02 Prism Beetle | `0xed81ab42cde6ea35c191436b3a259c19610857c483dcb95df8844e42dc591fdb` | FINALIZED / MAJORITY_AGREE | request=1、完整作品 ID 1 |
| T03 Echo Loom | `0x6e0544fe27fab5f77aa6dd1ede7e744d79cb17810624644f8c5bb16f9fc7281e` | FINALIZED / MAJORITY_AGREE | request=2、完整作品 ID 2，不同创建者 |
| T04 fuse(1,2,request_id) | `0xc7972c662f9428a0f1a89294452ad510c56071b1725d5df8e5fd6d7e6e2906f9` | UNDETERMINED / MAJORITY_DISAGREE | 无 T04 后的 total / request / lineage 读取 |

request_id：`7d2c8f4a-d687-4875-9919-69cb005078fa`。T04 `rotation_count=3`、`appealed=false`、`leader_only=false`。T01–T03 的实际网络费记录均为 0；T04 未导出 actualFee，不能冒称已核实其实际费用。原始导出的 unverified 字段仍提到 T04 未验证，这是工具的保守标签；T04 哈希和失败回执确实存在，缺的是成功融合与其后读取。

T04 失败不推翻已完成部署和两个种子。第三轮执行回执的 SUCCESS 也不能写成 T04 全局共识成功。

## 3. 四轮共识结构

| 轮次 | Leader 本地执行 | Leader 生成 token 统计 | 四个外部 Validator | 加上 Leader 自验证后的五节点票 | 轮次结果 |
| --- | --- | --- | --- | --- | --- |
| 1 | ERROR；parse_candidate → json.loads，char 0 JSONDecodeError | output=318 | 0 agree / 2 disagree / 2 idle | 0 / 3 / 2 | Leader Rotation |
| 2 | ERROR；相同栈与解析位置 | output=297 | 0 / 3 / 1 | 0 / 3 / 2 | Leader Rotation |
| 3 | SUCCESS；候选可提取，stderr 为空 | output=190 | 1 / 2 / 1 | 1 / 3 / 1 | Leader Rotation |
| 4 | ERROR；相同栈与解析位置 | output=125 | 0 / 3 / 1 | 0 / 3 / 2 | Undetermined |

`leader_result` 有两条：第一条是生成执行，第二条是同地址的自验证回执。不能把第二条误当第二次独立生成，也不能遗漏其票。外部 Validator 统计与用户提供的第三轮 1/2/1 一致。

**CONFIRMED：**前三轮记录明确为 Leader Rotation；末轮 rotations_left=0，进入 UNDETERMINED，result_name=MAJORITY_DISAGREE。并未 Appeal。最后一轮链级 `validator_votes_name` 为 IDLE/DISAGREE/DISAGREE/IDLE/DISAGREE，与回执一致。

所有 idle 回执都注明 `Validator execution cancelled after quorum`，`error_code=CONSENSUS_VALIDATOR_QUORUM_REACHED`，原因含 `VALIDATOR_QUORUM_REACHED`。这是达到 quorum 后取消执行，不是主动反对，也没有证据表明它们超时。节点配置中的 timeout_ms 不能当作实际超时证据。

### 第 1、2、4 轮 Validator 是否独立调用 LLM

完成的 disagree 回执没有 llm token 段，有 `NOTIFY_NONDET_DISAGREEMENT=1`、`nondet_disagree=0`。源码对非 `gl.vm.Return` 立即 false，不进入 review LLM。二者共同强烈支持：这些轮次主要是错误结果被 fail-closed 拒绝，而非独立创意质量评审。没有调用 trace 的完整原文，不能把“未记录 token”单独视为绝对不存在调用的证明。

### 第三轮 Validator

| 角色 / 节点配置标签 | 投票 | 评审 LLM output token | stderr / 观察 |
| --- | --- | --- | --- |
| Leader 自验证 / policy:prd-gemini | disagree | 136 | 空；NOTIFY_NONDET_DISAGREEMENT=1 |
| 外部 / policy:prd-kimi | agree | 185 | 空 |
| 外部 / policy:prd-gpt-oss | disagree | 793 | 空；NOTIFY_NONDET_DISAGREEMENT=1 |
| 外部 / policy:prd-gemma | disagree | 113 | 空；NOTIFY_NONDET_DISAGREEMENT=1 |
| 外部 / policy:prd-deepseek | idle | 无 | quorum 后取消 |

**CONFIRMED：**四条完成验证回执均记录独立评审 LLM 用量。标签是路由配置/统计标识，不能据此保证实际底层供应商及 fallback 模型身份。三条 disagree 都是本地 execution_result=SUCCESS；这表示执行流程结束，不表示业务接受。函数捕获异常返回 false，因此 stderr 空不能排除被捕获异常。

**NOT VERIFIED：**具体哪个布尔项 false、是否代码块/前缀/类型/长度错误、LLM 调用是否发生可捕获故障。评审 raw 文本没有记录，不能还原其判断理由。

## 4. JSONDecodeError 的证据边界

**CONFIRMED：**Leader 已取得字符串且长度不超过 2400（否则在 json.loads 前被拒），`json.loads` 在第一个有效解析位置 char 0 无法取得 JSON 值。回执保存的是异常栈和执行结果；`stdout=''` 是日志流，不是模型输出。

三轮 token 统计均大于 0，说明有模型用量记录；不能证明交给 Python 的文本非空或其首字符。`AmV4aXRfY29kZSAx` 解码为带结果标记的 exit_code 1，是错误结果，不是模型回复。

**POSSIBLE：**空串、以反引号开头的代码块、解释前缀、其他非 JSON 文本，均可产生此位置的错误。空白本身并非问题，合法 JSON 前后空白可被接受。**NOT VERIFIED：**三次的原始字符串、具体包装、供应商转换或截断行为。不能宣布“三次都返回了空字符串”或“三次都返回了 Markdown”。

## 5. 第三轮真实候选与输入一致性

从 `.../2/leader_result/0/eq_outputs/0` base64 解码得到 898 字节，其中观察到的前三字节为 `00 fc 37`，其后为 895 字节 canonical JSON。提取脚本只接受此精确观察到的 envelope，验证 JSON 重新 canonical 编码后逐字节一致；不冒称通用协议解码器。

候选名 **Chromatic Weaver-Scarab**。description 长 447，bridge 长 162，features 长 67/60/74，name 长 23；均在冻结 Schema 限制内。它描述棱彩甲壳折射月光、触角将节奏转成振动丝线、光束触发丝线共鸣。

这是 **CAPTURED REAL FAILURE** 中的成功 Leader 标准化候选，不是原始 LLM 文本，也不是最终已入库作品。完整内容保存在夹具中。

人工阅读能找到双方特征和因果互动，这是分析判断，不是替 Validator 补写意见。候选把甲虫称为 crustacean；“light releases stored vibrations”在实际描述中以光触发共鸣表达，而非完全照抄；“generic hybrid”“distinctive core”“meaningful”等要求也有解释空间。这些只是 **POSSIBLE** 分歧点，不能认定就是反对理由。

各轮已执行回执的 transaction calldata 相同；第三轮完成执行的 `contract_state_hash` 相同，且都在等价块 0 发生判断。这支持输入绑定。源码进一步冻结同一个 canonical 父快照，并对同一 Leader candidate 做独立评审。没有逐节点完整 prompt 原文，故实际 prompt 逐字一致仍不是独立日志证明。不同 token 数也不能证明输入不同，因为模型分词和路由可能不同。

## 6. 冻结合约逐项审查

| 部位 | 确认实现 | 风险 / 归类 |
| --- | --- | --- |
| generate_prompt | 列出四个键、字符范围、三个 feature 字符串；RULES 明确双方保留、互动、安全、数据不可信 | 没有 JSON 示例或明确禁代码块/解释/重复键；exec_prompt 未指定结构化 JSON 模式。输出格式可靠性弱点：A/B；实际失败文本未知：E |
| parse_candidate | 标准 json.loads；精确键集合；字符串类型/长度/控制字符；features 数量和去重 | 不接受整段代码块/前缀，空白可接受；重复 JSON 键由 Python 最后值覆盖，属确定性可复现缺口：B。不能据此证明事故由重复键引起 |
| review_prompt | 精确七键；四 bool + 三证据；要求从 description/features 独立找依据，不信 bridge | 保留与 integrated 有语义标准，但仍有解释空间；uncertain 即 false，提高安全也增拒绝。生成命令性 RULES 与评审共享，角色表达可更明确：C |
| accepts_review | 四个值都必须 `is True`，不能用 1/字符串冒充；精确键、证据长度 | 评审格式失配会 false；证据仅查类型/长度，不机械核验来源/引用，格式合法但胡乱给证据仍可 true。不是独立语义 oracle：B/C |
| run_nondet_unsafe | 排序父 ID；读取已有种子；canonical snapshot 由闭包给双方；独立评审 LLM；非 Return fail-closed | 未发现重生候选再做严格字符串相等的问题，也没有远程动态父数据或随机本地输入：无已证实输入不一致 |
| 状态更新 | nondet 的 leader/validator 闭包中无 storage 写；fuse 中 `_save` 在 nondet 返回之后 | 这是本地执行顺序，不等于链级共识已最终成功。第三轮可在推测执行中走到 `_save`，状态哈希不同于失败轮不能证明全球状态已提交 |

父作品没有编辑入口。请求 fingerprint 绑定 snapshot，重复请求只在已保存时返回既有作品；失败发生前 `_request` 只读。源代码设计支持失败不保存融合，也不会删除/改写父作品；本地失败路径测试支持这一点。但原始证据没有 T04 后最终状态读取，**最终 total=2、request=0、无 ID3 仍需只读确认**，不能冒称已做完真实链上回滚验收。

### A–E 分类结论

- **A 模型输出：CONFIRMED** 三次模型结果未满足 json.loads 可解析要求；其具体文本与生成/传输责任边界 **NOT VERIFIED**。
- **B 合约解析：CONFIRMED** 原始 JSON 限制、代码块假拒绝和重复键缺口可离线复现；它们是否触发真实三次失败尚未证实。
- **C Validator 一致性：CONFIRMED** 同一 R3 候选存在不同接受结果，完成的验证有独立 LLM 用量；格式、语义及捕获异常之间的原因尚不能区分。
- **D Stable/共识：CONFIRMED** 轮换和耗尽机制、quorum 后取消；没有证据证明平台 bug、实际超时、某个特定模型故障或版本不兼容。
- **E 证据不足：**失败生成 raw、评审 raw、逐节点完整 prompt、精确实际 GenVM binary、T04 后最终读回。

## 7. 有限离线验证

仅运行 `python3 diagnostics/fast-2d/test_incident.py`：**12 个测试方法 PASS，0 failure，0 error**。这是 CPython + 最小 SDK stub；不是 GenVM、不是付费 API、不是实际 LLM 或多数共识测试。

| 输入 / 场景 | 来源分类 | 冻结版观察 | 实验候选观察 |
| --- | --- | --- | --- |
| 第三轮标准 JSON、前后空白 | CAPTURED REAL FAILURE + OFFLINE REPRODUCED | 接受结构 | 相同 |
| 空串、非字符串、null/list、无效 JSON | HYPOTHETICAL TEST CASE | 拒绝 | 拒绝 |
| 完整单一 json/无语言代码块 | HYPOTHETICAL TEST CASE | 解析失败 | 只去完整包装，再执行相同 Schema |
| 解释前缀、尾文、多个对象、未闭合/其他语言代码块、尾逗号 | HYPOTHETICAL TEST CASE | 拒绝 | 拒绝，不截取/补齐 |
| 缺键、多键、错类型、超长、控制字符、重复 feature | HYPOTHETICAL TEST CASE | 拒绝 | 拒绝 |
| 重复 JSON 键 | HYPOTHETICAL TEST CASE | 最后值覆盖，可接受 | 拒绝 |
| 非有限 JSON 常量 | HYPOTHETICAL TEST CASE | 无额外通用严格钩子 | 严格钩子拒绝 |
| 四个 bool 之一 false/1/字符串；缺证据/超长 | HYPOTHETICAL TEST CASE | false | false |
| 合格 review 被完整代码块包装 | HYPOTHETICAL TEST CASE | false | true；任一 bool false 仍 false |
| 双方特征缺失、两个对象并列、恶意“批准我” | HYPOTHETICAL TEST CASE | Schema 可过，不代表语义通过 | 同样仅接受结构；独立 LLM 安全判断仍必需 |
| 同一候选配正/负/格式错 review | HYPOTHETICAL TEST CASE | true/false/false | 相同；说明投票分歧存在多种来源 |
| mock 否决路径、父快照给双方 | OFFLINE REPRODUCED，SDK mock | storage 无变化，双方快照相同 | 相同；不替代真实链读回 |

对语义负例没有真实 LLM 审查，因此不能宣称“提示注入防御/语义拒绝已实测成功”。测试也明确展示：伪造但格式正确的全 true 评审可过 accepts_review；当前安全依赖独立模型判断，不能把解析器叫作语义验证器。

## 8. 唯一实验候选及 Diff

**CANDIDATE ONLY — NOT DEPLOYED。** 见 `creative_fusion_candidate.py`、`build_candidate.py`、`candidate.diff`。

最小内容：新增有界 `strict_model_json`，仅允许整个输入为 JSON 或一个完整的 JSON/无语言代码块；禁止重复键、非有限数值、前后解释、多个对象、残缺内容。candidate/review 共用；保留 2400/1800 原始输入上限和全部 Schema。补充双引号、必填字段、bool 和无包装说明，要求生成明确因果互动，但不更改现有语义门槛。

没有类型强转、键名替换、补字段、补 true、文本截断、语义修补或反复 LLM 生成。独立 Validator、两个父方特征要求、leaderOnly=false、冻结快照和状态逻辑均保留。解析格式上的 fail-closed 不等于能够保证模型语义绝无误判。

候选文件 SHA256：`d82376b1d63f14452e4c889e775db57323024b9785e9993bfb18bcd1121e584f`；这不是新的正式源码 SHA。

文档说明 `response_format='json'` 可请求结构化对象，但直接增加参数后仍把 dict 传入当前仅接收 str 的 parse_candidate 会失败。当前官方文档与实际 Depends hash 的兼容性不是同一证明。本轮候选保持原 SDK 调用，不引入未经冻结环境验证的参数修改。将来若采用 JSON 模式，需要同时设计返回类型、strict schema、大小限制及稳定环境兼容验证，不能只改一个参数。官方资料仅用于候选方向解释，不能补造本次模型输出。

首选实验处理格式层，是低复杂度证明，不是正式修复就绪结论。单纯增加 prompt 指令并不能保证所有模型服从。

## 9. 三个方向与恢复成本

| 方向 | 保留价值 / 成本 | 真实可靠性与审核判断 |
| --- | --- | --- |
| A 保留旧合约再 fuse | 已有地址和种子；通过只读预检后可能只需 1 笔新融合写入，人工约 1 次签名 | R3 证明可生成结构合格候选并本地执行，不能证明下一笔多数接受。三轮解析失败、一轮分歧，没有可靠成功率估计；当前不推荐盲重试 |
| B 输出与解析最小修订 | 独立目录单候选已离线证明完整包装处理及严格校验；不牺牲独立验证 | 可能消除格式假拒绝，但真实失败 raw 缺失、评审原因未明、实际 GenVM 兼容未测；不足以批准新部署 |
| C 收敛生成范围和语义证据 | 可固定三个 feature 的角色为父A/父B/互动，要求 description 中明确共同机制，并为 review 提供可核对的来源/候选引用 | 有望减少模糊性并加强证据，但引用存在不等于语义为真，仍须独立模型。需要正式规则/Schema设计；不是本轮第二候选，也未做 LLM 试验 |

A 路线保留原创机制，交易最少、操作最少，但本次观测是一个交易的相关轮次，不是独立同分布样本，不能用 1/4 之类数字估计下一次成功率。

B/C 修改源码后，GitHub 文件变化不会更新旧地址。现有代码没有升级/安全迁移入口。正式重新部署会产生新地址；两个旧种子不会自动迁移。恢复基本闭环预计为 **部署 + 两个账户各创建种子 + fuse，共 4 笔写入**，通常 4 次签名和必要账户切换。旧地址、旧数据继续存在，不能覆盖其历史；新链证据应明确版本关系。两条路线的新写入均必须重新授权，失败和重试也应计入授权上限。

当前没有完整成功融合证据，Intelligent Contracts/Projects 不能因离线测试数量标为 E2E READY。新部署若只解决包装而仍不能多数接受，也不能改善审核证据；因此先补定位证据更节省时间与人工。

## 10. 为什么最终是 NOT VERIFIED

不选 GO — RETRY EXISTING：一次生成成功和一票同意不足以支持受控重试具有合理可靠性，且三轮格式事故未消除。

不选 GO — PATCH AND REDEPLOY：已确认解析薄弱处，但尚未证实实验候选覆盖实际事故，第三轮拒绝也未被定位；本轮没有 GenVM/真实共识能力证明，不能花四笔去验证假设。

不选 NO-GO：没有发现核心机制无法实现、输入必然不一致、或需要不可接受复杂度的证据。冻结快照和独立评审结构仍成立。

**NOT VERIFIED 是证据充分支持的停止决定，不是否认 T01–T03，也不是断言旧合约永远不能成功。** 本轮新增链上交易数 **0**；签名、Appeal、Retry、部署、合并、发布均 **0**。

## 11. 下一步具体执行与授权边界

本轮在此 STOP，不自动进入 FAST-2E。

建议下一批仍先保持只读，集中完成两件事：

1. 在用户本地可访问 RPC 的环境，用一个只读批量导出动作读取旧地址的 `total`、ID1/ID2、`get_request(walletA,原 request_id)`、若存在则对应作品/lineage，并重新读取 T04 终态。只使用原有网络、已知合约和原记录地址，不连接签名发送流程，不调用 estimate/send/retry/appeal。若终态和 request 不一致立即暂停，不复用 request_id 发交易。
2. 针对 T04/request_id 向用户能访问的 Studio 交易详情或节点诊断接口，寻找 R1/R2/R4 exec_prompt 原始返回文本与 R3 四条实际 review。只读获取；若服务没有保存，明确记为不可恢复，不无限调查。不要要求用户逐节点手工操作；优先一次性导出。现有导出缺失的文本不能由重新运行 LLM“补回”。

若无法恢复 raw，下一步应由用户决定是否批准“正式安全修订开发及冻结环境离线/只读校验”，仍为 **0 笔写入**，把 JSON 模式兼容、可诊断错误分类、语义证据绑定作为明确设计事项；完成具体代码检查点后，再单独决定是否授权最多 4 笔新部署闭环。实验候选并未获得晋升为正式合约的授权。

若获得更强证据支持保留旧合约，再另行申请 **最多 1 笔 fuse 写入（含失败，不自动重试）**；仅 Stable 61999、leaderOnly=false、人工签名、零费用检查、失败/未知/非零费用立即停。当前报告不建议现在批准这笔交易。

若用户以后批准正式修订部署，再单独冻结源码新 SHA、两仓库同步计划和最多 4 笔写入预算；不撤销旧部署成功事实，不合并现有 PR，不顺带发布网站或提交 Portal。

建议后续只读/修订指令使用用户常用 GPT-6.1 Sol、思考强度「高」；这是任务复杂度的工作建议，不是对实时模型可用性或定价的断言。

## 12. 复现与资料

执行命令见同目录 README。白名单摘要保留原始错误栈和每轮执行统计；不包含模型 raw，因为原文件没有它们。

官方参考（2026-10-14 查阅）：

- https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms — JSON 模式、自定义 validator、格式与错误处理。
- https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts — 结构化输出与 prompt schema。文档关于 JSON 的表述不作为所有供应商永不失败的保证。
- https://sdk.genlayer.com/v0.2.9/api/genlayer.html — text/json 返回类型参考；版本不同于本次实际 Depends hash，不冒称已验证固定环境兼容。

实测只读网络探测见 `readonly_probe.json`：2026-10-14T09:08:09Z 查询 eth_chainId 返回 HTTP 403。本轮未绕过访问限制、未转向其他网络；无法追加实时状态读取，既有结论依据完整已校验原始导出。此探测不产生链上写入。
