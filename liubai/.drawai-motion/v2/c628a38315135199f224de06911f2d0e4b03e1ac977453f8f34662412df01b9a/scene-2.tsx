import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain, paperWash } from './ink/paper'
import { W, H, ss, clamp01, lerp, ink, rnd, range, easeOut, easeInOut, n1, TAU } from './ink/core'
import { pen, inkText, seal, hairline, splatter } from './ink/brush'
import { mountain, mist, sunDisc, bird } from './ink/terrain'
import { MONO, SERIF } from './theme'

// 第三镜：千峰。日从墨里升起，山从水里浮出来。
// 全片第一个「辽阔」——镜头只做一件事：慢慢推出，让观众自己走进去。
const DUR = 240

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  const push = 1 + 0.055 * easeInOut(t)
  const sunX = W * 0.635
  const sunY = H * 0.315

  x.save()
  x.translate(sunX, sunY)
  x.scale(push, push)
  x.translate(-sunX, -sunY)

  // 天光：靠近日头的一圈暖
  const sky = x.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.62)
  sky.addColorStop(0, 'rgba(240,206,158,0.20)')
  sky.addColorStop(0.4, 'rgba(236,214,178,0.10)')
  sky.addColorStop(1, 'rgba(236,214,178,0)')
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = sky
  x.fillRect(0, 0, W, H)
  x.restore()

  // 日：朱砂，不是白色。压在山脊后面，起得极慢
  const rise = ss(0.05, 0.85, t)
  sunDisc(x, sunX, sunY + (1 - rise) * 90, H * 0.062, t, { tone: 0.95, alpha: 0.95, glow: 0.34 })

  // 远山：一层雾，一层影
  mountain(x, {
    base: H * 0.735, amp: H * 0.46, seed: 21, freq: 1.35, oct: 5, tone: 0.3, alpha: 0.55,
    peaks: [{ t: 0.16, w: 0.19 }, { t: 0.44, w: 0.24 }, { t: 0.72, w: 0.21 }, { t: 0.92, w: 0.14 }],
    key: 's2far', blur: 5.2, cun: 0.3, rise: ss(0.0, 0.5, t) }),
  mist(x, H * 0.66, H * 0.22, 0.34, 31, t)

  mountain(x, {
    base: H * 0.83, amp: H * 0.5, seed: 33, freq: 1.9, oct: 5, tone: 0.52, alpha: 0.86,
    peaks: [{ t: 0.1, w: 0.17 }, { t: 0.36, w: 0.22 }, { t: 0.62, w: 0.24 }, { t: 0.86, w: 0.18 }],
    key: 's2mid', blur: 2.4, cun: 0.75, rise: ss(0.06, 0.62, t) })
  mist(x, H * 0.78, H * 0.16, 0.3, 41, t)

  // 近峰：压在右下，给「深」
  mountain(x, {
    base: H * 1.06, amp: H * 0.38, seed: 57, freq: 2.4, oct: 6, tone: 0.9, alpha: 0.96,
    peaks: [{ t: 0.12, w: 0.16 }, { t: 0.42, w: 0.2 }, { t: 0.78, w: 0.22 }],
    key: 's2near', cun: 1.15, rise: ss(0.14, 0.78, t) })

  // 谷里的雾：把三层山缝起来
  mist(x, H * 0.9, H * 0.3, 0.42, 51, t)

  // 鸟：七只，慢，散
  x.save()
  for (let i = 0; i < 7; i++) {
    const sp = 0.012 + rnd(61, i) * 0.008
    const bx = W * 1.15 - ((t * sp + rnd(62, i) * 0.5) % 1.5) * W * 1.3
    const by = H * (0.2 + rnd(63, i) * 0.16) + Math.sin(t * 6 + i) * 6
    const s = 0.5 + rnd(64, i) * 0.5
    bird(x, bx - i * 34 * s, by + i * 9 * s, s, t * 9 + i * 1.7, 0.62, 0.5 * clamp01((t - 0.1) * 4))
  }
  x.restore()

  x.restore()

  // 题跋：右上一列，笔画一笔一笔落
  const tr = ss(0.34, 0.72, t)
  if (tr > 0) {
    const tx = W * 0.878
    inkText(x, '协同创作', tx, H * 0.15, {
      size: 58, font: SERIF, tone: 0.72, vertical: true, spacing: 16, reveal: tr, seed: 71, align: 'center',
    })
    hairline(x, tx + 46, H * 0.15, tx + 46, H * 0.15 + 260 * tr, tr, 83, 0.3)
    inkText(x, 'G R O K   C L I', tx - 14, H * 0.47, {
      size: 15, font: MONO, tone: 0.45, spacing: 1, align: 'center', reveal: clamp01((tr - 0.4) / 0.5), seed: 73,
    })
    seal(x, tx - 14, H * 0.545, 42, ['G', 'C'], { reveal: clamp01((tr - 0.75) / 0.25), seed: 75, rot: -0.02 })
  }

  // 底：一行小字，压住画面下沿的重心
  inkText(x, '二〇二五 · 冬', W * 0.5, H * 0.935, {
    size: 18, font: SERIF, tone: 0.4, spacing: 6, align: 'center',
    reveal: ss(0.55, 0.85, t), alpha: 1, seed: 91,
  })

  // 极其克制的暗角，把视线收到日中
  x.save()
  x.globalCompositeOperation = 'multiply'
  const vg = x.createRadialGradient(W * 0.55, H * 0.45, H * 0.28, W * 0.55, H * 0.45, W * 0.78)
  vg.addColorStop(0, 'rgba(255,255,255,0)')
  vg.addColorStop(1, 'rgba(96,82,62,0.34)')
  x.fillStyle = vg
  x.fillRect(0, 0, W, H)
  x.restore()

  drawGrain(x, f, 0.045, 7)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
