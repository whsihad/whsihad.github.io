import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain, paperWash } from './ink/paper'
import { W, H, ss, clamp01, lerp, ink, range, rnd, easeInOut, easeOut, n1, TAU } from './ink/core'
import { pen, splatter } from './ink/brush'
import { water, mist, boat, boatman, mountain } from './ink/terrain'

// 第七镜：他是笔。
// 老人抬起手，笔尖划过去的地方，天才亮。观众第一次看见「画」这个动作本身。
const DUR = 240

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  const figX = W * 0.42
  const figY = H * 0.78

  // 天：极淡，等着一笔
  x.save()
  x.globalCompositeOperation = 'multiply'
  const sky = x.createLinearGradient(0, 0, 0, H * 0.8)
  sky.addColorStop(0, 'rgba(206,188,158,0.30)')
  sky.addColorStop(0.6, 'rgba(228,212,182,0.18)')
  sky.addColorStop(1, 'rgba(240,228,204,0)')
  x.fillStyle = sky
  x.fillRect(0, 0, W, H)
  x.restore()

  // 水与舟：接着上一镜
  water(x, { y: H * 0.74, h: H * 0.3, tone: 0.4, alpha: 0.8, seed: 401, t, wave: 0.8 })
  mist(x, H * 0.72, H * 0.1, 0.36, 411, t * 0.5)

  x.save()
  x.translate(figX, figY)
  boat(x, 0, 12, 0.95, { tone: 0.74, t, seed: 421, canopy: false })
  boatman(x, -10, -6, 1.15, { tone: 0.78, lean: -0.05, pole: 1, arm: 0.35 + 0.5 * ss(0.05, 0.4, t) })
  x.restore()

  // 手臂抬起 → 笔尖从手里甩出去，划破天
  const stroke = ss(0.14, 0.86, t)
  if (stroke > 0.001) {
    const p0: [number, number] = [figX + 44, figY - 96]
    const p1: [number, number] = [figX + 250, figY - 330]
    const p2: [number, number] = [W * 0.86, H * 0.2]
    const p3: [number, number] = [W * 1.12, -H * 0.12]
    // 三次贝塞尔采样成笔路
    const pts: [number, number][] = []
    const N = 26
    for (let i = 0; i <= N; i++) {
      const u = i / N
      const a = Math.pow(1 - u, 3)
      const b = 3 * Math.pow(1 - u, 2) * u
      const c = 3 * (1 - u) * u * u
      const d = u * u * u
      pts.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]])
    }
    // 主体：一笔浓墨，起笔重、出锋轻
    pen(x, pts, {
      tone: 0.92, alpha: 0.94, w: 30, head: 0.02, tail: 0.42, dry: 0.42, bristle: 9,
      seed: 431, reveal: stroke, halo: 1.1, tip: 0.12,
    })
    // 侧锋：笔肚压出的一道淡影
    pen(x, pts.map(([px, py]) => [px + 16, py + 10] as [number, number]), {
      tone: 0.55, alpha: 0.34, w: 52, head: 0.12, tail: 0.6, dry: 0.8, bristle: 7,
      seed: 441, reveal: stroke * 0.96, halo: 1.4, tip: 0.3,
    })
    // 飞白：笔走到尽头，墨尽了
    for (let i = 0; i < 22; i++) {
      const u = range(451, i, 0.25, 1)
      const idx = Math.min(N, Math.floor(u * N))
      const [px, py] = pts[idx]
      pen(x, [[px, py], [px + range(452, i, 20, 150), py - range(453, i, 10, 90)]], {
        tone: 0.7, alpha: 0.3 * (1 - u * 0.4), w: range(454, i, 1.2, 4.2), head: 0.2, tail: 0.7,
        dry: 0.9, bristle: 2, seed: 455 + i, reveal: clamp01((stroke - u * 0.6) * 3), tip: 0.1,
      })
    }
    // 笔尖离纸的一滴
    splatter(x, p2[0] - 30, p2[1] + 16, clamp01((t - 0.6) * 2.2), 461, 26, 0.5, 0.8)
  }

  // 山从那一笔里长出来
  const grow = ss(0.55, 1.0, t)
  if (grow > 0) {
    mountain(x, {
      base: H * 0.88, amp: H * 0.5, seed: 471, freq: 1.6, oct: 5, tone: 0.8, alpha: 0.9,
      peaks: [{ t: 0.28, w: 0.2 }, { t: 0.66, w: 0.24 }], key: 's6near', cun: 1.2,
      rise: grow })
  }

  // 收：世界被画满，纸重新露出来（交给退画卷）
  paperWash(x, Math.pow(ss(0.88, 1.0, t), 2) * 0.55)

  drawGrain(x, f, 0.05, 19)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
