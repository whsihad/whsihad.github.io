import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, ss, clamp01, lerp, ink, range, easeInOut, n1 } from './ink/core'
import { pen, inkText, seal, hairline } from './ink/brush'
import { mountain, mist, water, boat, boatman, reflection, bird } from './ink/terrain'
import { MONO, SERIF } from './theme'

// 第五镜：江。一个人，一条船，一整个下午。
// 世界被擦掉之后剩下的是水——最空的东西，也是最满的。
const DUR = 240
const HORIZON = H * 0.615

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  // 远山：只剩一层影，淡到近乎没有
  mountain(x, {
    base: HORIZON + 6, amp: H * 0.26, seed: 211, freq: 1.4, oct: 4, tone: 0.28, alpha: 0.42,
    peaks: [{ t: 0.22, w: 0.22 }, { t: 0.62, w: 0.24 }], key: 's4far', blur: 6, cun: 0.15,
    rise: ss(0, 0.35, t) })
  mist(x, HORIZON - 10, H * 0.14, 0.4, 221, t)

  // 水：横笔，越远越密、越淡
  water(x, { y: HORIZON + 14, h: H * 0.38, tone: 0.42, alpha: 0.9, seed: 231, t, wave: 1 })
  // 倒影：山在水里再淡一次
  reflection(x, W * 0.42, HORIZON + 18, H * 0.3, W * 0.95, t, 241, 0.3)

  // 船：从右往左，极慢，慢到几乎不动
  const bt = easeInOut(t)
  const bx = lerp(W * 0.66, W * 0.4, bt)
  const by = HORIZON + H * 0.115 + Math.sin(t * 5.2) * 4
  const bob = Math.sin(t * 5.2 + 1) * 0.012

  x.save()
  x.translate(bx, by)
  x.rotate(bob)
  x.translate(-bx, -by)
  reflection(x, bx, by + 6, H * 0.12, W * 0.16, t, 251, 0.25)
  boat(x, bx, by, 78, { tone: 0.72, t, seed: 261, canopy: true, lantern: 0.9 })
  boatman(x, bx - 10, by - 18, 74, { tone: 0.7, lean: -0.04 + Math.sin(t * 2.4) * 0.012, pole: 1, arm: 0.5 + Math.sin(t * 2.4) * 0.06 })
  x.restore()

  // 水面的一条亮带：把船托起来
  x.save()
  x.globalCompositeOperation = 'screen'
  const gl = x.createLinearGradient(0, by, 0, by + H * 0.18)
  gl.addColorStop(0, 'rgba(255,246,220,0.16)')
  gl.addColorStop(1, 'rgba(255,246,220,0)')
  x.fillStyle = gl
  x.fillRect(bx - W * 0.2, by, W * 0.4, H * 0.18)
  x.restore()

  // 雾：江面上一线，把远与近分开
  mist(x, HORIZON + H * 0.04, H * 0.1, 0.34, 271, t * 0.6)

  // 两只鸟，很少
  for (let i = 0; i < 2; i++) {
    const px = W * 0.82 - ((t * (0.03 + i * 0.012) + i * 0.3) % 1.2) * W * 1.1
    bird(x, px, H * (0.2 + i * 0.05), 0.5, t * 7 + i * 2.2, 0.55, 0.32 * ss(0.1, 0.4, t))
  }

  // 题跋：左上竖排
  const tr = ss(0.22, 0.6, t)
  if (tr > 0) {
    inkText(x, '视觉语言', W * 0.115, H * 0.13, {
      size: 54, font: SERIF, tone: 0.66, vertical: true, spacing: 14, reveal: tr, seed: 281, align: 'center',
    })
    hairline(x, W * 0.115 - 44, H * 0.13, W * 0.115 - 44, H * 0.13 + 236 * tr, tr, 291, 0.26)
    inkText(x, 'G E M I N I', W * 0.115 + 16, H * 0.44, {
      size: 15, font: MONO, tone: 0.44, spacing: 1, align: 'center', reveal: clamp01((tr - 0.45) / 0.5), seed: 293,
    })
    seal(x, W * 0.115 + 16, H * 0.512, 40, ['G', 'M'], { reveal: clamp01((tr - 0.8) / 0.2), seed: 295, rot: 0.015 })
  }

  // 一条极淡的横线，压住画面上沿
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = ink(0.2, 0.08)
  x.fillRect(0, 0, W, 2)
  x.restore()

  drawGrain(x, f, 0.05, 13)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
