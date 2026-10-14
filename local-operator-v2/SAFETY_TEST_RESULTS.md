# FAST-2F V2 本地保护

MOCK PASS / NOT RUN LIVE。TypeScript check 与 49 项 Vitest 测试通过：保留 43 项安全和谱系检查，新增 5项V1/V2存储隔离与当前发布锁检查，以及1项实际锁定UI检查。未来授权开关仅在测试中 mock 为 true；正式构建为 false。原 V1 测试夹具不作为 V2 链上证据。

本轮无真实钱包连接、签名或交易。浏览器 QA 结果另见 V2_LOCAL_SERVER_QA.json；真实浏览器可用性未验证。
