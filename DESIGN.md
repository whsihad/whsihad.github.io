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

八份档案：X-001 人生概览 / 002 学习经历 / 003 职业经历 / 004 项目与成果 / 005 技能与专长 / 006 荣誉与证书 / 007 重要经历 / 008 未来规划。内容只写事实：`003` 明写「无正式任职、无实习」，`006` 明写「暂无公开奖项/证书」。

## 两个状态

```
entry   入口：LJH 无限符号 + PERSONAL PROFILE / READY + 打开个人介绍 / 直接查看简历
boot    开机：WELCOME TO MY PROFILE → LJH → PROFILE READY → 逐字解密 → WELCOME TO LU JIAHANG
archive 档案台：FILE NUMBER + 01/08 + 八格刻度，↑↓/拖动/滚轮切换
detail  详情：左 3D 磁带模型（拖动 360°），右档案正文、标签页、SAVE / EXPORT
```

## 部署与加载

- HTML 留在 GitHub Pages；JS / CSS / 字体 / GLB 走 `gcore.jsdelivr.net/gh/whsihad/whsihad.github.io@main/...`，国内实测比 Pages 快约 10 倍（40 KB/s → 450 KB/s）。CDN 失败时 `index.html` 自动回落到本地副本。
- 入口**不再等 3D 模型**（`assets/app.js` 里的 patch：`qe?.load()` 不再进 `Promise.all`），所以首屏 5 秒左右就能点；模型在后台下载，进场后自然补齐。
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
