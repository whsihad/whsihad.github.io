import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain, paperWash } from './ink/paper'
import { W, H, TAU, ss, clamp01, lerp, ink, rnd, range, easeOut, easeInOut, n2, scratch } from './ink/core'
import { pen, splatter, bleedRings } from './ink/brush'
import { mountain, mist } from './ink/terrain'

// 第二镜：一滴墨落下来，砸出一个世界。
// 全片唯一一次「暗」。暗不是背景，是盖在纸上的一层墨——被砸开，才露出纸。
const HIT = 0.4
const DROP_X = W * 0.5
const HIT_Y = H * 0.56

const NEAR = { base: H * 0.94, amp: H * 0.52, seed: 3, freq: 1.55, oct: 5, tone: 0.7, peaks: [{ t: 0.2, w: 0.2 }, { t: 0.53, w: 0.26 }, { t: 0.79, w: 0.17 }] }

const draw = (x: CanvasRenderingContext2D, f: number, dur: number): void => {
  const t = f / dur
  const hit = t >= HIT
  const dt = clamp01((t - HIT) / (1 - HIT))
  const tt = clamp01(t / HIT)
  const fall = Math.pow(tt, 2.15)

  x.drawImage(getPaper(), 0, 0)

  // —— 墨盖：暗场 + 被砸开的洞 ——
  const R = hit ? 80 + 2900 * easeInOut(clamp01(dt * 0.82)) : 0
  if (R < W * 1.9) {
    const [m, mx] = scratch('s1dark', W, H)
    const dg = mx.createLinearGradient(0, 0, 0, H)
    dg.addColorStop(0, 'rgb(22,20,18)')
    dg.addColorStop(0.46, 'rgb(32,29,25)')
    dg.addColorStop(0.74, 'rgb(74,66,53)')
    dg.addColorStop(1, 'rgb(112,99,80)')
    mx.fillStyle = dg
    mx.fillRect(0, 0, W, H)

    if (R > 4) {
      const blob = (grow: number, blur: number, alpha: number) => {
        mx.globalCompositeOperation = 'destination-out'
        mx.filter = `blur(${blur}px)`
        mx.globalAlpha = alpha
        mx.fillStyle = '#000'
        mx.beginPath()
        const N = 72
        for (let i = 0; i <= N; i++) {
          const a = (i / N) * TAU
          const wob = 1 + 0.13 * n2(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 7) + 0.06 * Math.sin(a * 5 + 1.1) + 0.04 * Math.sin(a * 11 + 2.3)
          const rr = R * grow * wob
          const px = DROP_X + Math.cos(a) * rr
          const py = HIT_Y + Math.sin(a) * rr * 0.86
          if (i === 0) mx.moveTo(px, py)
          else mx.lineTo(px, py)
        }
        mx.closePath()
        mx.fill()
        mx.filter = 'none'
        mx.globalAlpha = 1
      }
      blob(1, 90, 1)
      blob(0.97, 26, 1)
    }
    x.drawImage(m, 0, 0)
  }

  // 浮尘
  x.save()
  x.globalCompositeOperation = 'screen'
  for (let i = 0; i < 46; i++) {
    const px = range(71, i, 0, W) + Math.sin(t * 5 + i) * 9
    const py = ((range(72, i, 0, H) - t * 70 * range(73, i, 0.4, 1.7)) % (H + 90) + H + 90) % (H + 90) - 45
    const a = (0.05 + 0.14 * n2(px * 0.01, py * 0.01 + t, i)) * (1 - dt * 0.95)
    x.fillStyle = `rgba(255,247,229,${Math.max(0, a)})`
    x.beginPath()
    x.arc(px, py, range(74, i, 0.6, 2.2), 0, TAU)
    x.fill()
  }
  x.restore()

  // —— 墨滴 ——
  if (!hit) {
    const v = tt
    const rx = 20 / (1 + v * 1.25)
    const ry = 20 * (1 + v * 1.45)
    const dy = lerp(-160, HIT_Y, fall)
    if (v > 0.2) {
      pen(x, [[DROP_X, dy - ry * 2.6], [DROP_X + 1.5, dy - ry * 6.5 - v * 56]], {
        tone: 0.5, alpha: 0.2 * v, w: rx * 0.52, head: 0.55, tail: 0.95, bristle: 0, seed: 11, tip: 0,
      })
    }
    x.save()
    x.fillStyle = ink(0.95, 1)
    x.beginPath()
    x.ellipse(DROP_X, dy, rx, ry, 0, 0, TAU)
    x.fill()
    if (v > 0.08) {
      x.beginPath()
      x.moveTo(DROP_X - rx * 0.6, dy - ry * 0.7)
      x.quadraticCurveTo(DROP_X, dy - ry * (2.3 + v * 2.4), DROP_X + rx * 0.6, dy - ry * 0.7)
      x.closePath()
      x.fill()
    }
    x.restore()
    // 边缘光：让一滴墨在暗里也看得出来
    x.save()
    x.globalCompositeOperation = 'screen'
    x.strokeStyle = `rgba(255,246,222,${0.5 * clamp01(v * 3)})`
    x.lineWidth = 1.6
    x.filter = 'blur(1.6px)'
    x.beginPath()
    x.ellipse(DROP_X, dy, rx * 0.92, ry * 0.94, 0, 0, TAU)
    x.stroke()
    const g = x.createRadialGradient(DROP_X - rx * 0.3, dy - ry * 0.5, 0, DROP_X - rx * 0.3, dy - ry * 0.5, rx * 3.4)
    g.addColorStop(0, 'rgba(255,248,232,0.3)')
    g.addColorStop(0.45, 'rgba(255,244,220,0.07)')
    g.addColorStop(1, 'rgba(255,244,220,0)')
    x.filter = 'none'
    x.fillStyle = g
    x.beginPath()
    x.arc(DROP_X - rx * 0.25, dy - ry * 0.4, rx * 3.4, 0, TAU)
    x.fill()
    x.restore()
  }

  // —— 砸下去 ——
  if (hit) {
    const shake = Math.exp(-dt * 11)
    x.save()
    x.translate(W / 2 + Math.sin(dt * 66) * 6 * shake, H / 2 + Math.cos(dt * 51) * 5 * shake)
    const z = 1 + Math.exp(-dt * 7) * 0.026
    x.scale(z, z)
    x.translate(-W / 2, -H / 2)

    // 溅：只有墨点。冠不画——山的升起本身就是这场溅的延续。
    const splashFade = 1 - ss(0.22, 0.55, dt)
    if (splashFade > 0.01) {
      splatter(x, DROP_X, HIT_Y - 10, dt * 1.5, 21, 130, 0.55, 0.94)
      splatter(x, DROP_X, HIT_Y - 10, dt * 1.1, 77, 40, 0.22, 0.98)
      bleedRings(x, DROP_X, HIT_Y, dt * 1.3, 5, 300, 0.3 * splashFade)
    }
    x.restore()

    // 山从墨里长出来
    const rise = ss(0.3, 1.0, dt)
    if (rise > 0) {
      mountain(x, { ...NEAR, rise: Math.min(1, rise * 1.2), key: 's1far', blur: 3.6, alpha: 0.82 })
      mountain(x, { ...NEAR, base: H * 1.03, amp: H * 0.4, seed: 8, tone: 0.84, rise: Math.min(1, Math.max(0, rise - 0.16) * 1.5), peaks: [{ t: 0.35, w: 0.22 }, { t: 0.68, w: 0.2 }], key: 's1near', cun: 0.7 })
      mist(x, H * 0.78, H * 0.34, 0.7 * ss(0.42, 0.92, dt), 12, 0)
    }
  }

  // 世界亮起来
  if (hit) paperWash(x, Math.pow(dt, 2.4) * 0.4)

  drawGrain(x, f, 0.05, 5)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
