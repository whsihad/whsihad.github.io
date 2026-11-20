# 视频工程

规格：1920×1080 / 24fps / 2880 帧（120.00 秒）

## 分镜

- shot-1：第 0–191 帧，文件 scene-0.tsx
- shot-2：第 192–431 帧，文件 scene-1.tsx
- shot-3：第 432–671 帧，文件 scene-2.tsx
- shot-4：第 672–911 帧，文件 scene-3.tsx
- shot-5：第 912–1151 帧，文件 scene-4.tsx
- shot-6：第 1152–1391 帧，文件 scene-5.tsx
- shot-7：第 1392–1631 帧，文件 scene-6.tsx
- shot-8：第 1632–1919 帧，文件 scene-7.tsx
- shot-9：第 1920–2207 帧，文件 scene-8.tsx
- shot-10：第 2208–2495 帧，文件 scene-9.tsx
- shot-11：第 2496–2879 帧，文件 scene-10.tsx

## 分镜表

- shot-1：在黑暗中开一条纸的裂缝，让片名从墨里洇出来；建立深海底噪；画面 近黑；一根极细的横向亮线像纸边被撕开；OPUS 5.5 从湿墨里渗出，笔锋带飞白；文案 OPUS 5.5 / 出品
- shot-2：一滴墨的慢镜坠落，落点炸开成山；让水花的冠与山峰同形；画面 微距墨滴逆光悬停，尘点漂浮；下坠拉伸，落纸瞬间墨爪四射；镜头急拉远，水花即山脉
- shot-3：世界展开：群山、雾带、朱日、墨瀑、飞鸟；题跋式署名不打断画面；画面 极远景群山分层，雾带横移，朱红日轮升起，瀑布自崖口倾下，鸟群掠过；右缘竖排小字；文案 协同创作 · GROK CLI
- shot-4：城从笔触里长出来，快节奏时间流逝，最后穿门而出；画面 山谷中楼阁、城墙、长桥一笔笔立起；昼夜闪烁表示数百年；镜头贴水穿门
- shot-5：下到河面：灯船、倒影；抬头星辰连成一支笔；画面 低机位掠过墨河，灯船拖出光的尾迹；仰拍夜空，星点连线成笔；题跋浮现又散；文案 视觉语言 · GEMINI
- shot-6：全片最狠的反转：巨笔把世界一笔抹掉，声音全断，只剩纸；画面 虚焦笔尖掠过上方；所过之处城、树、鸟被擦成空白纸；最后一盏灯灭；满幅留白，唯余淡影；文案 空
- shot-7：从空白里一笔画出江；一叶孤舟一个人；呼吸变慢；画面 空纸上一条横笔写出江面；小舟入画；九成留白；极缓推进；墨屑飘落
- shot-8：第一次看清一张脸；他抬头看天，再看向镜头——观众意识到镜头是一支笔；画面 中近景老人侧脸，墨分五色；睁眼；转向镜头；推入瞳孔，虹膜里映出倒悬的笔尖；文案 视
- shot-9：他举起自己的笔，向上画出一道；天被劈开，光灌进来，镜头被拽出画外；画面 抬笔、落笔的决断；一道竖笔穿出画框；纸面沿笔迹裂开，强光；粒子逆流上升；文案 笔
- shot-10：揭示：这世界是一幅卷轴；镜头退出画卷；题名与钤印落下；画面 俯拍桌面卷轴，画只占一小块；一支笔自行题字；卷轴收卷一声脆响；留白二字写出，朱印压下；文案 留白 / THE BLANK
- shot-11：片尾字幕做成竖排题跋；最后一句箴言，收在印与空白之间；画面 竖排小字自右向左；末句出现；画面渐退，只剩朱印与一线纸色；黑场；文案 执笔者，亦是笔。/ THE ONE WHO PAINTS IS ALSO PAINTED.

## 音频

（无音频）

## 约定

- 内置素材可用 motion_assets list 查看：builtin/paper.svg、builtin/grain.svg、builtin/grid.svg 可用 staticFile 引用；builtin/whoosh.wav、builtin/impact.wav 可通过 motion_audio add 加入时间轴。素材是 DrawAI 程序生成的通用素材，不是上游原片素材。
- 工程内置 Noto Sans SC、Noto Serif SC 及常用上游字体，场景可按字体名使用；个别字体与上游特定字重可能仍需补充。
- 需要纹理或乐器单音时，先看用户素材和 motion_assets {action:"list",nodeId}，再用 {action:"library",nodeId,query:"纸张"} 或 query:"钢琴" 搜索插件库；{action:"use",nodeId,assetId:id} 导入所选条目。图片用返回的 file 调 staticFile，声音须另用 motion_audio {action:"add",nodeId,file,role:"sfx",at:秒} 放入时间轴；先查看来源和许可，试听确认电平。单音不是完整配乐。
- 插件素材随安装包提供，素材 ID 不是工作区路径。不要猜路径、从其他工程拷贝素材或手写 manifest.json；使用 library 返回的 ID 调 use，失败时报告具体错误。
- 一场景一文件，单文件不超过 120 行；共享元素放 components/。
- 场景组件 default export，签名 ({ shot, anchors, assets, render }) => ReactNode；时间用 useCurrentFrame()，相对本段起点。
- scene-kit/ 是场景层脚手架：det.ts（确定性随机 + Halton 抖动，禁 Math.random）、grow.ts（弹簧/落体/生长曲线闭式解）、look.tsx（SSAA/软阴影/色调映射/颗粒/暗角）。要画质就先看这三件，别在场景里另写一套。
- 累积采样数与快门时长从 render.samples / render.shutter 读，不要写死数字。
- 改完先渲染 3 帧看图（motion_preview），确认后再跑全片（motion_render）。
- 配色主题：水墨写意（颜色/字体从 theme.ts 取，别手写十六进制）。
- 整片风格：水墨写意（23-ink-wash）—— 施工说明见 STYLE.md，写每一镜之前先读它。
- 时间轴改动只改 timeline.json 的 startFrame / durationFrames，不要改场景文件里的绝对帧号。

## 描述

《留白》THE BLANK — 120 秒水墨史诗短片。一滴墨坠落成世界，城邦兴起又在一笔之间被抹去，江上孤翁回头看向镜头，举起自己的笔划破天空，镜头退出画卷。全片纯 Canvas2D 程序化绘制，宣纸与毛笔语法，主题：执笔者，亦是笔。

