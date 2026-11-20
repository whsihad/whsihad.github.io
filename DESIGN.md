# DESIGN.md · 鲁家杭 / 个人介绍（莱茵引擎版）

公开地址：**https://whsihad.github.io/**
仓库：`whsihad/whsihad.github.io`（`main`），推上去即自动构建。

## 这是什么

不是重画，是**照搬引擎再换内容**：cjf 的个人介绍本身就是把「莱茵生命 · 交互桌面」这套 Wallpaper Engine 工程改了内容做成的。所以这里直接把同一套引擎（three.js 场景 + GLB 档案模型 + 开机动画 + 档案台 + 详情页）搬进来，只替换身份与八份档案。

- 引擎：`assets/app.js`（约 0.95 MB，Vite 打包产物）与 `assets/index-fctQMwOk.css`（0.65 MB）。
- 3D：`assets/archive-cassette.*.glb`（3.4 MB，开机时加载）、`archive-assembly.*.glb`（3.2 MB，详情页按需）。
- 字体：MiSans 4 个字重 × 188 个按 `unicode-range` 切片的 woff2，`fonts/misans-webfont-4.3.1/`。
- 音频：`audio/`（atmosphere / motif / pulse / 键盘音）。
- 档案导出：`archives/RHINE-LAB-X-001..008.txt`（详情页 EXPORT 下载的就是它们）。

## 内容改造（`_build/ljh/`）

`records.mjs` = 八份档案数据，`build.mjs` 把 bundle 里的 `G_` 数组整块换掉，并替换身份字符串：

| 原 | 现 |
|---|---|
| CHEN JINFENG / Chen Jinfeng | LU JIAHANG / Lu Jiahang |
| 陈锦锋 | 鲁家杭 |
| CJF | LJH |
| cjf0423706@qq.com | l18868142811@163.com |
| sakura4388 | whsihad |
| chenjinfeng-homepage.pages.dev | whsihad.github.io |

八份档案（自己的八个栏目，配图在 `assets/records/`）：

| 编号 | 栏目 | 内容 | 图 |
|---|---|---|---|
| X-001 | 关于我 ABOUT | 一句话、事实表、正在做 | — |
| X-002 | 学习与 AI LEARNING IN PUBLIC | 在学、怎么用 AI、接下来 | — |
| X-003 | 我做过什么 SELECTED WORK | 五个项目 + 一个例子 + 判断标准 | 5 张截图 |
| X-004 | 随手一拍 MOMENTS | 九张照片、拍什么、为什么拍 | 9 张照片 |
| X-005 | 代码之外 OFFLINE | 游戏、城市、跑步 | — |
| X-006 | 明日方舟 ARKNIGHTS | 为什么喜欢、怎么玩、留下什么 | — |
| X-007 | 现在的目标 NEXT | 眼前三件事、再远一点、不做什么 | — |
| X-008 | 联系 CONTACT | 邮箱、GitHub、替代入口 | — |

图片写进档案数据里：`'IMG:assets/records/01.jpg|01 双人海战棋'`，`build.mjs` 给 bundle 的 `S0()` 打了补丁，把这种行渲染成 `<figure>`；`.tab-panel` 从 189px 放大到 306px，图片按三列网格排。内容只写事实：`X-003` 的项目描述与截图一一对应，没有的奖项、实习一律不写。

## 两个状态

```
entry   入口：LJH 无限符号 + PERSONAL PROFILE / READY + 打开个人介绍 / 直接查看简历
boot    开机：WELCOME TO MY PROFILE → LJH → PROFILE READY → 逐字解密 → WELCOME TO LU JIAHANG
archive 档案台：FILE NUMBER + 01/08 + 八格刻度，↑↓/拖动/滚轮切换
detail  详情：左 3D 磁带模型（拖动 360°），右档案正文、标签页、SAVE / EXPORT
```

## 部署与加载

- HTML 留在 GitHub Pages；JS / CSS / 字体 / GLB 走 `gcore.jsdelivr.net/gh/whsihad/whsihad.github.io@<commit>/...`，国内实测比 Pages 快约 10 倍（40 KB/s → 450 KB/s）。CDN 失败时 `index.html` 自动回落到本地副本。
- **jsDelivr 的 `@main` 有缓存，会继续发旧包**：每次部署后必须跑 `node _tools/pin-cdn.mjs <新 commit 短哈希>` 把地址钉到那个 commit，再提交一次。本机预览（localhost）始终走本地文件，不受影响。
- 入口**不再等 3D 模型**（`assets/app.js` 里的 patch：`qe?.load()` 不再进 `Promise.all`），所以首屏 5 秒左右就能点；模型在后台下载，进场后自然补齐。
- 模型没下完就进详情时，正文会被场景动画卡在透明状态，`index.html` 里有一段兜底：5 秒后加 `force-detail-visible`，强制显示正文并隐去解密遮罩。
- 实测冷启动（国内直连）：入口可点约 5 s，档案台约 8–10 s 完整。

## 手机端

`assets/ljh-mobile.css`（只在 ≤480px 生效）：

- 右上角图标下移一行，避开标题；
- 档案描诉块加纸色渐变纱（`linear-gradient` + `backdrop-filter: blur(4px)`），文字不再压在密集的 3D 条上；
- 底部信息条允许换行、字号提一档。

引擎自带的 portrait 布局已处理刻度、底部栏和 44px 触控尺寸。

## 本地预览

```
双击  启动预览.cmd
或    node _tools/serve.mjs . 8800     → http://127.0.0.1:8800/
```

必须走 http：`file://` 会被 ES module 与 GLB fetch 的 CORS 拦掉。

## 目录

```
index.html                 页面骨架 + Wallpaper Engine host shim
assets/                    app.js、CSS、GLB、ljh-mobile.css
fonts/ audio/ archives/ icons/ licenses/
_build/ljh/                档案数据与构建脚本（不进仓库）
_old/                      旧版（星轨版、档案台版）与 v1 素材
_tools/                    serve.mjs、shot.mjs、archive_txt.mjs、patch_noblock.mjs
```

## 版权

引擎与 3D 素材来自创意工坊作品 *Rhine Lab · 莱茵生命交互桌面*，字体为 MiSans（小米，见 `fonts/MiSans-license.pdf`），许可与第三方说明保留在 `licenses/`。个人自用，不作商用。
