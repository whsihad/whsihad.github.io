import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain, paperWash } from './ink/paper'
import { W, H, ss, clamp01, lerp, ink, easeInOut } from './ink/core'
import { inkText, seal, hairline } from './ink/brush'
import { mountain, mist } from './ink/terrain'
import { MONO, SERIF } from './theme'

// 第十一镜：片尾。
// 山退到最底下，只剩一行一行的字，最后一次落款。
const DUR = 384

type Credit = { cn: string; en?: string; size: number; gap: number; tone: number; mono?: boolean }

const CREDITS: Credit[] = [
  { cn: '留白', en: 'THE BLANK', size: 132, gap: 132, tone: 0.92 },
  { cn: '构想 · 剧本 · 导演', en: 'OPUS 5.5', size: 26, gap: 96, tone: 0.72 },
  { cn: '协同创作', en: 'GROK CLI', size: 26, gap: 84, tone: 0.66 },
  { cn: '视觉语言', en: 'GEMINI', size: 26, gap: 84, tone: 0.66 },
  { cn: '画面', en: '程序化水墨 · 实时渲染', size: 26, gap: 96, tone: 0.6 },
  { cn: '一纸留白，万物在其中。', size: 24, gap: 84, tone: 0.5 },
]

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  // 最后的山：只留一道影，退到画面最下
  const back = ss(0.0, 0.5, t)
  mountain(x, {
    base: H * 1.0, amp: H * 0.16, seed: 801, freq: 1.4, oct: 4, tone: 0.42, alpha: 0.24 * back,
    key: 's10', blur: 5, cun: 0.15, rise: back })
  mist(x, H * 0.945, H * 0.08, 0.4, 811, t * 0.3)

  // 字幕逐行浮出
  const T0 = 0.06
  const step = 0.115
  let y = H * 0.2
  CREDITS.forEach((c, i) => {
    const t0 = T0 + i * step
    const k = ss(t0, t0 + 0.14, t)
    if (k > 0.005) {
      const dy = (1 - k) * 14
      inkText(x, c.cn, W * 0.5, y + dy, {
        size: c.size,
        font: SERIF,
        tone: c.tone,
        spacing: c.size > 60 ? 30 : 12,
        align: 'center',
        reveal: k,
        seed: 820 + i * 7,
      })
      if (c.en) {
        inkText(x, c.en, W * 0.5, y + dy + c.size * 0.86, {
          size: c.size > 60 ? 20 : 15,
          font: MONO,
          tone: c.tone * 0.72,
          spacing: c.size > 60 ? 6 : 2,
          align: 'center',
          reveal: clamp01((k - 0.35) / 0.6),
          seed: 830 + i * 7,
        })
      }
      // 分隔线：只在大标题下面画一条
      if (i === 0) hairline(x, W * 0.5 - 150, y + dy + 96, W * 0.5 + 150, y + dy + 96, clamp01((k - 0.3) / 0.6), 841, 0.28)
    }
    y += c.gap
  })

  // 片尾印
  seal(x, W * 0.5, H * 0.865, 62, ['留', '白'], { reveal: ss(0.78, 0.9, t), seed: 851, rot: -0.01 })

  // 最后：整幅收回纸里
  paperWash(x, Math.pow(ss(0.9, 1.0, t), 1.6) * 0.72)

  drawGrain(x, f, 0.04, 37)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
