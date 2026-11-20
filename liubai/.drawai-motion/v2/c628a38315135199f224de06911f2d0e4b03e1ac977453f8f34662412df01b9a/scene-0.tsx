import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain, inkFade } from './ink/paper'
import { W, H, ss, clamp01, scratch, n1 } from './ink/core'
import { inkText, hairline } from './ink/brush'
import { MONO, SERIF } from './theme'

// 第一镜：黑暗里裂开一道缝。光不是淡入的，是被撕开的。
// 这一镜只做一件事：让观众相信「这张纸本来就在，只是还没被打开」。
const draw = (x: CanvasRenderingContext2D, f: number, dur: number): void => {
  const t = f / dur
  const cx = W / 2
  const cy = H * 0.52

  x.drawImage(getPaper(), 0, 0)

  // 缝：先一个点，再一条横线，再拉开成整幅
  const hw = W * 1.72 * ss(0.0, 0.19, t)
  const hh = Math.max(3, H * 1.7 * Math.pow(ss(0.05, 0.47, t), 2.4))

  // 只建路径，不填。撕口是毛的：上下两条边带噪声，不是刀切的直线。
  const aperture = (ctx: CanvasRenderingContext2D) => {
    const N = 56
    const jitter = (u: number, salt: number) => {
      const x0 = cx - hw / 2 + u * hw
      return (n1(x0 * 0.012 + salt * 13, 17 + salt) - 0.5) * 2 * (hh * 0.05) + (n1(x0 * 0.09 + salt * 3, 31) - 0.5) * hh * 0.02
    }
    ctx.beginPath()
    ctx.moveTo(cx - hw / 2, cy - hh / 2 + jitter(0, 1))
    for (let i = 1; i <= N; i++) {
      const u = i / N
      ctx.lineTo(cx - hw / 2 + u * hw, cy - hh / 2 + jitter(u, 1))
    }
    for (let i = N; i >= 0; i--) {
      const u = i / N
      ctx.lineTo(cx - hw / 2 + u * hw, cy + hh / 2 + jitter(u, 2))
    }
    ctx.closePath()
  }

  // 光在缝里先亮一层，纸才像被照亮，而不是被替换
  if (hw > 4 && hh > 4) {
    x.save()
    aperture(x)
    x.clip()
    x.globalCompositeOperation = 'screen'
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(hw * 0.5, 420))
    g.addColorStop(0, 'rgba(255,250,236,0.22)')
    g.addColorStop(0.5, 'rgba(255,246,226,0.1)')
    g.addColorStop(1, 'rgba(250,240,220,0)')
    x.fillStyle = g
    x.fillRect(0, 0, W, H)
    x.restore()
  }

  // 暗：一层墨，中间被撕开
  const darkK = 1 - ss(H * 1.36, H * 1.6, hh)
  if (darkK > 0.004) {
    const [m, mx] = scratch('s0dark', W, H)
    const dg = mx.createLinearGradient(0, 0, 0, H)
    dg.addColorStop(0, 'rgb(21,19,17)')
    dg.addColorStop(0.55, 'rgb(15,14,13)')
    dg.addColorStop(1, 'rgb(11,10,9)')
    mx.fillStyle = dg
    mx.fillRect(0, 0, W, H)

    mx.globalCompositeOperation = 'destination-out'
    mx.fillStyle = '#000'
    mx.filter = 'blur(58px)'
    mx.globalAlpha = 0.6
    aperture(mx)
    mx.fill()
    mx.filter = 'blur(18px)'
    mx.globalAlpha = 1
    aperture(mx)
    mx.fill()
    mx.filter = 'none'
    mx.globalCompositeOperation = 'source-over'
    x.save()
    x.globalAlpha = darkK
    x.drawImage(m, 0, 0)
    x.restore()

    // 撕口上的光：纸边被点燃的那一线
    x.save()
    x.globalCompositeOperation = 'screen'
    x.filter = 'blur(7px)'
    x.strokeStyle = `rgba(255,238,200,${0.42 * darkK * (1 - ss(0.5, 0.92, t))})`
    x.lineWidth = 2.2
    aperture(x)
    x.stroke()
    x.filter = 'none'
    x.restore()
  }

  // 纸在呼吸：极淡的墨气缓慢流过，大留白不能是死白
  const mistK = ss(0.28, 0.52, t) * (1 - ss(0.88, 0.99, t))
  if (mistK > 0.01) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    for (let i = 0; i < 3; i++) {
      const px = W * (0.22 + 0.28 * i) + Math.sin(t * 1.6 + i * 2.1) * W * 0.12
      const py = H * (0.34 + 0.16 * i) + Math.cos(t * 1.2 + i) * H * 0.1
      const rr = W * (0.34 + 0.12 * i)
      const g = x.createRadialGradient(px, py, 0, px, py, rr)
      g.addColorStop(0, `rgba(148,130,102,${0.05 * mistK})`)
      g.addColorStop(0.55, `rgba(148,130,102,${0.022 * mistK})`)
      g.addColorStop(1, 'rgba(148,130,102,0)')
      x.fillStyle = g
      x.fillRect(px - rr, py - rr, rr * 2, rr * 2)
    }
    x.restore()
  }

  // 片头字
  const tr = ss(0.16, 0.4, t)
  const out = 1 - ss(0.84, 0.97, t)
  const push = 1 + 0.028 * ss(0.2, 1.0, t)
  if (tr > 0) {
    x.save()
    x.translate(cx, H * 0.5)
    x.scale(push, push)
    x.translate(-cx, -H * 0.5)
    inkText(x, 'A   F I L M   B Y', cx, H * 0.395, {
      size: 20, font: MONO, tone: 0.5, spacing: 2, align: 'center',
      reveal: clamp01((tr - 0.25) / 0.6), alpha: out, seed: 3,
    })
    inkText(x, 'OPUS 5.5', cx, H * 0.505, {
      size: 122, font: SERIF, weight: 400, tone: 0.92, spacing: 9, align: 'center',
      reveal: tr, alpha: out, seed: 5,
    })
    hairline(x, cx - 214, H * 0.588, cx + 214, H * 0.588, clamp01((tr - 0.45) / 0.45), 7, 0.4)
    inkText(x, 'P R E S E N T S', cx, H * 0.638, {
      size: 20, font: MONO, tone: 0.55, spacing: 4, align: 'center',
      reveal: clamp01((tr - 0.55) / 0.4), alpha: out, seed: 9,
    })
    x.restore()
  }

  // 收：纸重新合上
  const dark = ss(0.9, 1.0, t)
  if (dark > 0) inkFade(x, dark * 0.95)

  drawGrain(x, f, 0.05, 3)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
