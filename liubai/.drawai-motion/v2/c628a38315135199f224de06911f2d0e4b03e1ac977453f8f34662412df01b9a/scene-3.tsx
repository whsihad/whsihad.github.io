import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, TAU, ss, clamp01, lerp, ink, rnd, range, easeOut, easeInOut, n1, n2, scratch } from './ink/core'
import { pen } from './ink/brush'
import { mountain, mist, city, bird } from './ink/terrain'

// 第四镜：城在谷里亮起来，然后被一笔抹掉。
// 全片的转折：世界不是被毁掉的，是被「收起」的——像画错了，擦掉。
const DUR = 240
const SWEEP0 = 0.56
const SWEEP1 = 0.94

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  const sweep = ss(SWEEP0, SWEEP1, t)
  const ex = lerp(-W * 0.25, W * 1.32, easeInOut(sweep))

  // 世界先画进一张单独的纸，才好被「擦」
  const [wc, wx] = scratch('s3world', W, H)
  wx.clearRect(0, 0, W, H)

  // 天：一层极淡的暖，靠地平线
  const sky = wx.createLinearGradient(0, 0, 0, H * 0.8)
  sky.addColorStop(0, 'rgba(240,226,198,0)')
  sky.addColorStop(0.65, 'rgba(238,214,172,0.34)')
  sky.addColorStop(1, 'rgba(232,204,160,0.5)')
  wx.save()
  wx.fillStyle = sky
  wx.fillRect(0, 0, W, H)
  wx.restore()

  mountain(wx, {
    base: H * 0.72, amp: H * 0.34, seed: 101, freq: 1.5, oct: 5, tone: 0.34, alpha: 0.6,
    peaks: [{ t: 0.2, w: 0.2 }, { t: 0.55, w: 0.26 }, { t: 0.85, w: 0.18 }],
    key: 's3far', blur: 4.6, cun: 0.25, rise: ss(0, 0.4, t) })
  mist(wx, H * 0.69, H * 0.16, 0.32, 111, t)

  mountain(wx, {
    base: H * 0.9, amp: H * 0.3, seed: 131, freq: 2.2, oct: 5, tone: 0.62, alpha: 0.88,
    peaks: [{ t: 0.14, w: 0.16 }, { t: 0.78, w: 0.2 }],
    key: 's3mid', blur: 1.8, cun: 0.7, rise: ss(0.04, 0.5, t) })
  mist(wx, H * 0.87, H * 0.12, 0.26, 141, t)

  // 城：长在谷底，灯笼是唯一的暖色
  const ct = ss(0.1, 0.62, t)
  if (ct > 0.01) city(wx, { cx: W * 0.44, base: H * 0.885, scale: 1.05, t: ct, tone: 0.78, seed: 151, lights: ct })
  // 岸：几笔横向的坡，把城托住
  for (let i = 0; i < 5; i++) {
    const yy = H * (0.9 + i * 0.022)
    pen(wx, [[-40, yy + range(161, i, -4, 4)], [W * 0.45, yy + range(162, i, -6, 6)], [W + 40, yy + range(163, i, -5, 5)]], {
      tone: 0.55, alpha: 0.3 - i * 0.04, w: 3.4 - i * 0.4, head: 0.3, tail: 0.4, bristle: 3, seed: 171 + i, tip: 0.2,
    })
  }

  for (let i = 0; i < 5; i++) {
    const bx = W * 0.9 - ((t * (0.02 + rnd(181, i) * 0.012) + rnd(182, i) * 0.6) % 1.4) * W * 1.2
    bird(wx, bx, H * (0.24 + rnd(183, i) * 0.13), 0.45 + rnd(184, i) * 0.4, t * 8 + i * 2, 0.6, 0.42 * ss(0.05, 0.3, t))
  }

  // 擦：一笔带过去，留下的是纸
  if (sweep > 0) {
    wc.save()
    wc.globalCompositeOperation = 'destination-out'
    wc.fillStyle = '#000'
    const N = 40
    wc.beginPath()
    wc.moveTo(-W * 0.3, H * 1.4)
    for (let i = 0; i <= N; i++) {
      const u = i / N
      const yy = H * (1.42 - 0.78 * u)
      // 前端是湿的：笔尖带出的毛边
      const tip = ex - H * 0.06 * Math.sin(u * Math.PI) - (n1(u * 8 + 3, 191) - 0.5) * H * 0.05
      wc.lineTo(tip, yy)
    }
    wc.lineTo(-W * 0.3, H * 0.62)
    wc.closePath()
    wc.globalAlpha = 0.98
    wc.filter = 'blur(3px)'
    wc.fill()
    wc.filter = 'none'
    wc.globalAlpha = 1
    wc.restore()
  }
  x.drawImage(wc, 0, 0)

  // 笔尖的湿边：墨被推到了断口上
  if (sweep > 0.001 && sweep < 0.999) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.filter = 'blur(4px)'
    x.strokeStyle = ink(0.66, 0.5)
    x.lineWidth = 7
    x.beginPath()
    for (let i = 0; i <= 40; i++) {
      const u = i / 40
      const yy = H * (1.42 - 0.78 * u)
      const tip = ex - H * 0.06 * Math.sin(u * Math.PI) - (n1(u * 8 + 3, 191) - 0.5) * H * 0.05
      if (i === 0) x.moveTo(tip, yy)
      else x.lineTo(tip, yy)
    }
    x.stroke()
    x.filter = 'none'
    x.restore()
  }

  // 被擦掉的城：最后几粒灯，随纸一起散
  if (sweep > 0.02) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    for (let i = 0; i < 26; i++) {
      const px = range(201, i, W * 0.1, W * 0.8)
      if (px > ex - 20) continue
      const py = H * (0.86 + rnd(202, i) * 0.07)
      const a = clamp01(1 - sweep * 1.4) * range(203, i, 0.2, 0.5)
      x.fillStyle = ink(0.5, a)
      x.beginPath()
      x.arc(px, py, range(204, i, 1, 2.6), 0, TAU)
      x.fill()
    }
    x.restore()
  }

  // 一颗钤印压在右下：这一笔是被「签过字」的
  if (sweep > 0.92) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.globalAlpha = ss(0.92, 1, t) * 0.9
    x.fillStyle = 'rgba(196,40,30,0.9)'
    x.fillRect(W * 0.845, H * 0.83, 54, 54)
    x.restore()
  }

  drawGrain(x, f, 0.045, 11)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
