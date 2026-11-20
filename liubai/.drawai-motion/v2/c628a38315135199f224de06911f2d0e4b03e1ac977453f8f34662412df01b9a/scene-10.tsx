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
  const 