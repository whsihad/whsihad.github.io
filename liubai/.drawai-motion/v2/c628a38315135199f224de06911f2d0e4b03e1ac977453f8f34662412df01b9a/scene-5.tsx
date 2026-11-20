import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, ss, clamp01, lerp, ink, range, rnd, easeInOut, n1, TAU } from './ink/core'
import { pen } from './ink/brush'
import { eye } from './ink/figure'

// 第六镜：眼。全片最近的一次注视。
// 瞳孔里倒着的那一笔，就是镜头——观众这才明白：看的人也在被画。
const DUR = 240

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  const cx = W * 0.5
  const cy = H * 0.54
  // 极慢的推：从半张脸推到只有一只眼
  const R = lerp(H * 0.2, H * 0.265, easeInOut(t))

  // 皮肤的暗：脸是一整块淡淡的墨，只有眼窝里最深
  x.save()
  x.globalCompositeOperation = 'multiply'
  const face = x.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 5.2)
  face.addColorStop(0, 'rgba(120,102,78,0.16)')
  face.addColorStop(0.42, 'rgba(132,114,88,0.3)')
  face.addColorStop(0.78, 'rgba(140,120,92,0.42)')
  face.addColorStop(1, 'rgba(150,130,100,0.5)')
  x.fillStyle = face
  x.fillRect(0, 0, W, H)
  x.restore()

  // 笠檐：压在上沿的一道黑
  x.save()
  x.globalCompositeOperation = 'multiply'
  const brim = x.createLinearGradient(0, 0, 0, H * 0.2)
  brim.addColorStop(0, ink(0.9, 0.92))
  brim.addColorStop(0.6, ink(0.86, 0.5))
  brim.addColorStop(1, ink(0.8, 0))
  x.fillStyle = brim
  x.beginPath()
  x.moveTo(-20, -20)
  x.lineTo(W + 20, -20)
  x.lineTo(W + 20, H * 0.1)
  x.quadraticCurveTo(W * 0.5, H * 0.2, -20, H * 0.11)
  x.closePath()
  x.fill()
  x.restore()

  // 眉：两道枯笔，几乎被虚焦吃掉
  for (let k = 0; k < 2; k++) {
    const yy = cy - R * 1.72 + k * 16
    pen(x, [
      [cx - R * 2.5, yy + R * 0.3],
      [cx - R * 1.2, yy - R * 0.05],
      [cx + R * 0.2, yy - R * 0.18],
      [cx + R * 1.6, yy + R * 0.06],
      [cx + R * 2.3, yy + R * 0.26],
    ], {
      tone: 0.62, alpha: 0.24 - k * 0.08, w: R * 0.15 - k * R * 0.05,
      head: 0.2, tail: 0.5, dry: 0.75, bristle: 6, seed: 301 + k, tip: 0.25, halo: 0.6,
    })
  }

  // 眼
  eye(x, cx, cy, R, {
    open: 1 - 0.06 * Math.sin(t * Math.PI),
    t,
    look: lerp(-0.06, 0.02, easeInOut(t)),
    reflect: clamp01(0.4 + t * 0.9),
    glow: 0.55,
    seed: 311,
  })

  // 眼下：一记干笔，把眼窝托住
  pen(x, [
    [cx - R * 1.5, cy + R * 1.32],
    [cx - R * 0.4, cy + R * 1.55],
    [cx + R * 0.8, cy + R * 1.5],
    [cx + R * 1.7, cy + R * 1.24],
  ], { tone: 0.5, alpha: 0.26, w: R * 0.08, head: 0.3, tail: 0.45, dry: 0.8, bristle: 5, seed: 321, tip: 0.2, halo: 0.5 })

  // 胡须：从画面底部伸进来几根
  for (let i = 0; i < 13; i++) {
    const x0 = W * (0.2 + rnd(331, i) * 0.6)
    const len = H * (0.08 + rnd(332, i) * 0.16)
    const sway = Math.sin(t * 1.6 + i) * 6
    pen(x, [
      [x0, H + 20],
      [x0 + range(333, i, -26, 26) + sway, H - len * 0.55],
      [x0 + range(334, i, -46, 46) + sway * 1.6, H - len],
    ], {
      tone: 0.55, alpha: 0.16 + rnd(335, i) * 0.16, w: 2.4 + rnd(336, i) * 2.2,
      head: 0.35, tail: 0.7, dry: 0.6, bristle: 4, seed: 337 + i, tip: 0.2,
    })
  }

  drawGrain(x, f, 0.05, 17)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
