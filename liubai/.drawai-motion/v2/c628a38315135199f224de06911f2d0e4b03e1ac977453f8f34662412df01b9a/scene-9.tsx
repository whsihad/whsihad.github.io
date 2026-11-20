import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, TAU, ss, clamp01, lerp, ink, easeInOut, easeOut, scratch } from './ink/core'
import { pen, inkText, seal, hairline } from './ink/brush'
import { MONO, SERIF } from './theme'

// 第十镜：笔与手。
// 一支笔落下来，落在一个「人」的位置上。句子写完，笔就停了。
const DUR = 288

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  // 笔：从右上落下来
  const drop = easeOut(ss(0.0, 0.42, t))
  const tipY = lerp(-H * 0.5, H * 0.585, drop)
  const tipX = W * 0.5

  x.save()
  x.translate(tipX, tipY)
  x.rotate(-0.26)

  // 笔杆：竹，两笔见节
  const shaftLen = H * 1.5
  pen(x, [[0, -H * 0.06], [4, -shaftLen * 0.5], [2, -shaftLen]], {
    tone: 0.72, alpha: 0.9, w: 44, head: 0.5, tail: 0.5, dry: 0.35, bristle: 6, seed: 701, halo: 0.35, tip: 0.4,
  })
  // 笔箍
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = ink(0.88, 0.9)
  x.fillRect(-30, -H * 0.115, 60, H * 0.03)
  x.restore()
  // 笔锋：尖端带墨
  x.save()
  x.beginPath()
  x.moveTo(-24, -H * 0.085)
  x.quadraticCurveTo(-16, -H * 0.02, 0, 0)
  x.quadraticCurveTo(16, -H * 0.02, 24, -H * 0.085)
  x.closePath()
  const tipG = x.createLinearGradient(0, -H * 0.085, 0, 6)
  tipG.addColorStop(0, ink(0.85, 0.9))
  tipG.addColorStop(0.6, ink(0.95, 0.96))
  tipG.addColorStop(1, ink(0.98, 1))
  x.fillStyle = tipG
  x.fill()
  x.restore()
  x.restore()

  // 落点：墨化开，句子也从这里开始
  const hit = ss(0.3, 0.52, t)
  if (hit > 0) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    const rr = 10 + 92 * easeOut(hit)
    const g = x.createRadialGradient(tipX, H * 0.585, 0, tipX, H * 0.585, rr)
    g.addColorStop(0, ink(0.92, 0.9))
    g.addColorStop(0.55, ink(0.7, 0.4))
    g.addColorStop(1, ink(0.5, 0))
    x.fillStyle = g
    x.beginPath()
    x.arc(tipX, H * 0.585, rr, 0, TAU)
    x.fill()
    x.restore()
  }

  // 句子：一笔一笔写出来
  const line = ss(0.34, 0.86, t)
  if (line > 0) {
    inkText(x, '执笔者，亦是笔。', W * 0.5, H * 0.365, {
      size: 118, font: SERIF, tone: 0.94, spacing: 10, align: 'center', reveal: line, seed: 711,
    })
    inkText(x, 'T H E   O N E   W H O   P A I N T S   I S   A L S O   P A I N T E D', W * 0.5, H * 0.47, {
      size: 17, font: MONO, tone: 0.5, spacing: 2, align: 'center', reveal: clamp01((line - 0.55) / 0.45), seed: 721,
    })
    hairline(x, W * 0.5 - 300, H * 0.305, W * 0.5 + 300, H * 0.305, clamp01((line - 0.2) / 0.6), 731, 0.26)
  }

  // 印：最后压上去
  seal(x, W * 0.845, H * 0.7, 74, ['留', '白'], { reveal: ss(0.82, 0.96, t), seed: 741, rot: 0.02 })

  drawGrain(x, f, 0.045, 31)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
