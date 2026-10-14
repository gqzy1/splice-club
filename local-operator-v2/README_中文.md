# SPLICE V2 本地操作台（FAST-2F）

V2 候选，尚未部署。当前构建 DEPLOYMENT_ENABLED=false：准备与签名入口均锁定；只有另行明确授权的新发布批次才可开放。不要自行改常量或删除浏览器记录来绕过。

本包放在独立目录 local-operator-v2。V1 的 local-operator 不变，V1 源码、4179 端口及存储不迁移、不删除。V2 固定地址 http://127.0.0.1:4180，存储键 splice.fast2f.operator.v2，state.version=2。旧 V1 合约地址、旧 SHA 或旧作品会被拒绝。

Windows 安装 Node.js 22.12+ 后，双击 START_SPLICE_LOCAL.cmd。启动会验证源码与文件摘要，按锁文件安装依赖、构建并打开 Chrome。启动不会发起交易；后续获授权版本仍需要 OKX 每笔单独签名与 A/B 账户切换。

未来流程仍为 T01 A 部署新完整源码 → T02 A 在新地址创建种子 → T03 B 在同一新地址创建种子 → T04 A 使用该 V2 地址已经读回的两个 ID 融合。不是沿用旧地址的 ID1/2。

已保存 intent/Hash、只读重查、补录 Hash、零费用与链ID保护仍保留。遇到失败、未知或非零费用停止，不自动重发。导出 SPLICE_V2_EVIDENCE_*.json 只下载到本机，不向外上传。

测试：npm run check；npm test；npm run build。operator.test.ts 在测试中模拟授权开关，运行未来受控四阶段引擎；isolation.test.ts 测真实发布开关保持关闭。两者均使用模拟钱包/RPC，绝非链上成功证明。
