# 鲁家杭 · 个人介绍（莱茵生命引擎版）

单页应用：入口浮层 → 开机动画 → 3D 档案台 → 档案详情。
引擎来自 Wallpaper Engine 工程《莱茵生命 · 交互桌面》（workshop 3799142774）；陈锦锋的个人介绍是这层引擎换内容后的产物，这一版把内容换成鲁家杭。

## 文件

```
index.html                     入口（Wallpaper Engine host shim 改版）
assets/app.js                  引擎（three.js r183 已打包，967 KB）
assets/index-fctQMwOk.css      样式（MiSans 分块字体，667 KB）
assets/archive-*.glb           档案磁带 / 装配 / 精度三档模型
fonts/misans-webfont-4.3.1/    MiSans 4 字重 × 190 分块（24 MB）
audio/                         氛围 / 动机 / 脉冲 / 打字音
archives/RHINE-LAB-X-00N.txt   八份档案的导出文本（EXPORT 用）
icons/ favicon.svg             无限符号标记（+ / −）
_old/                          旧版「星轨终端」与「档案台」两份备份
_build/ljh/                    八份档案的源数据与构建脚本
_tools/                        本地预览 / 截图 / 字体工具
```

## 四屏

1. **入口**：磨砂白 `#e8e5e1`，居中无限符号标记 + `LJH`，`PERSONAL PROFILE / READY`，两条下划线按钮「打开个人介绍」「直接查看简历」。
2. **开机**：`WELCOME TO MY PROFILE` → 标记放大 → 逐字打出 `PROFILE READY` → `WELCOME TO LU JIAHANG`，随后镜头推进到档案台。
3. **档案台**：真 3D 档案阵列（GLB + 光影），HUD 浮层——左上 `PERSONAL INTRODUCTION`、右上档案索引/收藏/设置、中央 `FILE NUMBER: X-001`、左下 `01 / 08` 与八格刻度、右下 `ABOUT LU JIAHANG`、底部人物与时间。
4. **详情**：左侧 3D 磁带模型（可拖拽 360°）+ `NO.001 / PERSONAL PROFILE`，右侧档案正文、分节导航、`SAVE ARCHIVE` / `EXPORT` / 页码。

## 八份档案

| 编号 | 标题 | 栏目 |
|---|---|---|
| X-001 | 人生概览 / LIFE OVERVIEW | 个人概况 · 在做的事 · 兴趣与目标 |
| X-002 | 学习经历 / EDUCATION | 在学 · 怎么学 · 接下来 |
| X-003 | 职业经历 / EXPERIENCE | 现状（无正式任职） · 合作过的事 |
| X-004 | 项目与成果 / PROJECTS | 五个项目 · 做完的与没做完的 |
| X-005 | 技能与专长 / CAPABILITIES | 能上手 · 在学 |
| X-006 | 荣誉与证书 / RECORDS | 暂无公开奖项（如实写明） |
| X-007 | 重要经历 / MILESTONES | 时间线 |
| X-008 | 未来规划 / NEXT | 短期 · 长期 |

内容全部来自旧版个人主页，没有编造；没有的部分直接写明「暂无」。

## 运行

`file://` 打不开（ES module + GLB 走 fetch，被 CORS 拦），要起本地服务：

```powershell
node _tools/serve.mjs . 8800     # 或任意静态服务器
# http://127.0.0.1:8800
```

部署到 GitHub Pages（`whsihad.github.io`）即可直接访问。也可把整个目录丢进 Wallpaper Engine 当 web 壁纸。

## 交互

- 拖动档案台切换档案；`↑ ↓` 翻档案、`Enter` 读取、`Esc` 返回、`/` 索引、`S` 收藏。
- 右上 `设置`：配色（磨砂白 / 石墨黑）、动效开关。
- 详情页 `EXPORT` 下载 `archives/RHINE-LAB-X-00N.txt`。

## 改内容

八份档案的正文在 `_build/ljh/records.mjs`，改完跑：

```powershell
node _build/ljh/build.mjs      # 重写 assets/app.js 里的记录数组 + 替换身份串
node _tools/archive_txt.mjs    # 重新生成 archives/*.txt
```

身份串（姓名、邮箱、GitHub、缩写）在 `_build/ljh/build.mjs` 的替换表里。
