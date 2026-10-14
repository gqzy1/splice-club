# SPLICE.CLUB FAST-2G V2 本机签名包

AUTHORIZED V2 LOCAL OPERATOR。仅 Stable Studionet 61999，本批最多4次签名尝试，失败/拒签/未知均停止，不重试。V2真实链上尚未执行。

## 启动

1. 将ZIP完整解压至新目录，不要覆盖V1或混用旧dist。
2. 需要Node.js 22.12或更新版本。未安装时使用 https://nodejs.org/ 官方Windows安装器；本包不自动下载安装程序。
3. 双击 START_SPLICE_LOCAL.cmd，保持命令窗口打开。先核验完整性，必要时按锁文件安装依赖，再启动本地服务并打开Chrome。首次安装依赖需要网络。
4. 页面必须显示 AUTHORIZED V2 LOCAL OPERATOR，固定 http://127.0.0.1:4180。若端口占用、校验失败、页面仍提示锁定，停止并保留错误，不换端口。启动不会请求签名。

## 本机执行

连接明确选中的OKX Provider，确认账户A及61999，完成只读环境检查。每步先点“准备”（只读），核对参数后勾选确认，再主动点对应SIGN按钮并亲自在OKX确认：

- T01：A部署冻结V2完整源码，空构造参数，leaderOnly=false。
- T02：A在读回的新合约创建Prism Beetle。
- T03：在OKX切换B（必须不同于A），重新做只读检查，创建Echo Loom。
- T04：切回原A、重新做只读检查，使用同一新合约读回的两个真实ID融合。

每步须FINALIZED、MAJORITY_AGREE、执行成功、零实际费用并读回核验，才开放下一步。任何拒签/估费失败/费用非零/错误/未知立即停止。钱包弹窗账户、网络、金额、费用必须与预检一致，否则拒签。预检60秒有效，不允许自动连续执行。

## 恢复和证据

刷新只恢复当前intent/Hash，不重发。若已有V2执行记录，保留并只读恢复，禁止清除localStorage、更换配置或端口获取新额度。没有RESET入口；V1端口4179和记录保持独立。

已发送的原Hash可“只读重新查询”；仅已保存且缺Hash的intent可补录钱包历史中的真实Hash。仍未知时停止。语义勾选只记录人工可见检查，不能制造链上成功。EXPORT EVIDENCE将JSON下载至本机，不自动上传。请把真实证据带回核验，勿分享任何私钥或助记词。

## 验证范围

详见SAFETY_TEST_RESULTS.md。MOCK/DOM和本地浏览器测试不是真实钱包或共识证明。Windows原生cmd及真人OKX操作须在你的本机完成。不得追加第5笔、Appeal、自动重发、复用V1种子或部署V1。

V2源码SHA256：4a92361b30f2b504ec02e699a816bab78cac47504dafafa9a2ca158c947f07b1。
