// 地景：山、水、雾、城、舟、飞鸟。全部程序化，全部由笔与晕染构成。
import { W, H, TAU, clamp, clamp01, ink, lerp, rnd, range, n1, ridgeNoise, ss, easeOut, easeInOut, scratch, paperC } from './core'
import { pen, wash, blob, Pt } from './brush'

// ── 山 ────────────────────────────────────────────────────────────────
export type Peak = { t: number; w: number }
export type MountainOpts = {
  base: number
  amp: number
  seed: number
  freq?: number
  oct?: number
  tone?: number
  alpha?: number
  peaks?: Peak[]
  rise?: number
  cun?: number
  cunTone?: number
  mist?: number
  blur?: number
  key?: string
}

export function ridgeY(u: number, o: MountainOpts): number {
  const peaks = o.peaks ?? [{ t: 0.5, w: 0.34 }]
  let env = 0
  for (const p of peaks) env = Math.max(env, Math.exp(-Math.pow((u - p.t) / p.w, 2)))
  const n = ridgeNoise(u * (o.freq ?? 1.7) * 4 + o.seed * 0.31, o.seed, o.oct ?? 5)
  return o.base - o.amp * env * (0.52 + 0.48 * n) - o.amp * 0.05 * n
}

export function mountain(x: CanvasRenderingContext2D, o: MountainOpts): void {
  const key = o.key ?? 'mtn'
  const alpha = o.alpha ?? 1
  const tone = o.tone ?? 0.5
  const rise = clamp01(o.rise ?? 1)
  if (rise <= 0.001 || alpha <= 0.001) return

  const draw = (c: CanvasRenderingContext2D): void => {
    const path = new Path2D()
    path.moveTo(-20, H * 1.2)
    const step = 5
    const first: Pt[] = []
    for (let px = -20; px <= W + 20; px += step) {
      const y = lerp(o.base + 40, ridgeY(px / W, o), rise)
      first.push([px, y])
      path.lineTo(px, y)
    }
    path.lineTo(W + 20, H * 1.2)
    path.closePath()
    const g = c.createLinearGradient(0, o.base - o.amp, 0, o.base + o.amp * 0.55)
    g.addColorStop(0, ink(tone, 1))
    g.addColorStop(0.45, ink(tone * 0.6, 1))
    g.addColorStop(1, ink(tone * 0.12, 1))
    c.fillStyle = g
    c.fill(path)

    // 皴：沿山脊往下扫的短笔，是「石」不是「色块」
    if ((o.cun ?? 1) > 0) {
      const count = Math.round(150 * (o.cun ?? 1))
      for (let i = 0; i < count; i++) {
        const u = rnd(o.seed + 40, i)
        const ridgeNow = lerp(o.base + 40, ridgeY(u, o), rise)
        if (rise < 0.98 && rnd(o.seed + 48, i) > rise) continue
        const y0 = ridgeNow + range(o.seed + 41, i, 4, o.amp * 0.5)
        if (y0 > o.base + o.amp * 0.4) continue
        const slope = (ridgeY(clamp01(u + 0.008), o) - ridgeY(clamp01(u - 0.008), o)) / (0.016 * W)
        const ang = Math.atan(slope) + Math.PI / 2 + (rnd(o.seed + 42, i) - 0.5) * 0.5
        const len = range(o.seed + 43, i, o.amp * 0.06, o.amp * 0.26)
        const px = u * W
        const dir = rnd(o.seed + 44, i) > 0.5 ? 1 : -1
        pen(c, [[px, y0], [px + Math.cos(ang) * len * 0.55 * dir, y0 + Math.sin(ang) * len * 0.55], [px + Math.cos(ang) * len * dir, y0 + Math.sin(ang) * len]], {
          tone: (o.cunTone ?? tone * 0.8) * range(o.seed + 45, i, 0.7, 1.05),
          alpha: range(o.seed + 46, i, 0.18, 0.42) * clamp01(rise * 1.2),
          w: range(o.seed + 47, i, o.amp * 0.008, o.amp * 0.03),
          head: 0.05,
          tail: 0.55,
          dry: 0.55,
          bristle: 4,
          seed: o.seed + i,
          tip: 0.15,
        })
      }
    }
  }

  if (o.blur && o.blur > 0) {
    const [c, cx] = scratch(key, W, H)
    cx.save()
    draw(cx)
    cx.restore()
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.globalAlpha = alpha
    x.filter = `blur(${o.blur}px)`
    x.drawImage(c, 0, 0)
    x.filter = 'none'
    x.restore()
  } else {
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.globalAlpha = alpha
    draw(x)
    x.restore()
  }

  if ((o.mist ?? 0) > 0) mist(x, o.base + o.amp * 0.1, o.amp * 0.5, o.mist, o.seed, 0)
}

// 云气：纸色横带，source-over 压在墨上 —— 不是画白，是把纸推回来
export function mist(x: CanvasRenderingContext2D, y: number, h: number, alpha: number, seed = 1, t = 0): void {
  if (alpha <= 0.001) return
  const [c, cx] = scratch('mist', W, H)
  for (let i = 0; i < 16; i++) {
    const cx0 = range(seed + 60, i, -100, W + 100) + t * range(seed + 61, i, -12, 12)
    const cy0 = y + range(seed + 62, i, -0.35, 0.35) * h
    const rx = range(seed + 63, i, W * 0.16, W * 0.46)
    const ry = h * range(seed + 64, i, 0.18, 0.55)
    const g = cx.createRadialGradient(cx0, cy0, 0, cx0, cy0, rx)
    g.addColorStop(0, paperC(0.85))
    g.addColorStop(0.55, paperC(0.45))
    g.addColorStop(1, paperC(0))
    cx.save()
    cx.translate(cx0, cy0)
    cx.scale(1, ry / rx)
    cx.translate(-cx0, -cy0)
    cx.fillStyle = g
    cx.beginPath()
    cx.arc(cx0, cy0, rx, 0, TAU)
    cx.fill()
    cx.restore()
  }
  x.save()
  x.globalAlpha = clamp01(alpha)
  x.filter = 'blur(10px)'
  x.drawImage(c, 0, 0)
  x.filter = 'none'
  x.restore()
}

// 水：横向长笔 + 皱波；夜里靠灯影亮起来
export function water(
  x: CanvasRenderingContext2D,
  o: { y: number; h: number; tone?: number; alpha?: number; seed?: number; t?: number; wave?: number },
): void {
  const tone = o.tone ?? 0.4
  const seed = o.seed ?? 21
  const alpha = o.alpha ?? 1
  const t = o.t ?? 0
  const lines = Math.round(o.h / 26)
  for (let i = 0; i < lines; i++) {
    const yy = o.y + (i / lines) * o.h + range(seed, i, -6, 6)
    const cnt = 5 + Math.floor(rnd(seed + 1, i) * 6)
    for (let k = 0; k < cnt; k++) {
      const x0 = range(seed + 2, i * 20 + k, -60, W + 60)
      const len = range(seed + 3, i * 20 + k, 40, 260) * (1 + i / lines)
      const wob = (o.wave ?? 1) * range(seed + 4, i * 20 + k, 3, 16)
      pen(x, [
        [x0, yy],
        [x0 + len * 0.5, yy + Math.sin((x0 + t * 40) * 0.004 + i) * wob],
        [x0 + len, yy + Math.sin((x0 + len + t * 40) * 0.004 + i) * wob * 0.5],
      ], {
        tone: tone * range(seed + 5, i * 20 + k, 0.55, 1.1),
        alpha: alpha * range(seed + 6, i * 20 + k, 0.14, 0.4),
        w: range(seed + 7, i * 20 + k, 1.2, 3.6),
        head: 0.2,
        tail: 0.5,
        dry: 0.45,
        bristle: 3,
        seed: seed + i * 31 + k,
        tip: 0.3,
      })
    }
  }
}

// 灯影：水面上一列抖动的暖色，用 lighter 叠，才像是「光」不是「漆」
export function lightPath(x: CanvasRenderingContext2D, cx: number, y0: number, y1: number, w: number, t: number, seed = 5, strength = 1): void {
  x.save()
  x.globalCompositeOperation = 'lighter'
  const n = Math.round((y1 - y0) / 7)
  for (let i = 0; i < n; i++) {
    const q = i / n
    const y = y0 + q * (y1 - y0)
    const amp = w * (0.35 + q * 0.9)
    const off = Math.sin(t * 3.1 + i * 0.55 + seed) * amp * 0.6 + Math.sin(t * 7.3 + i * 1.7) * amp * 0.18
    const a = (1 - q) * 0.5 * strength
    x.fillStyle = `rgba(226,170,52,${a * 0.5})`
    x.beginPath()
    x.ellipse(cx + off, y, amp * (0.55 + 0.45 * Math.sin(i * 0.9 + t * 2)), Math.max(1, w * 0.09), 0, 0, TAU)
    x.fill()
  }
  x.restore()
}

// 日 / 月：一枚印在纸上的朱红圆
export function sunDisc(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, o: { tone?: number; alpha?: number; glow?: number } = {}): void {
  const a = clamp01(o.alpha ?? 1)
  if (a <= 0.001) return
  const glow = o.glow ?? 1
  if (glow > 0) {
    const g = x.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * (2.6 + glow))
    g.addColorStop(0, `rgba(196,40,30,${0.2 * a})`)
    g.addColorStop(0.5, `rgba(196,40,30,${0.07 * a})`)
    g.addColorStop(1, 'rgba(196,40,30,0)')
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.fillStyle = g
    x.beginPath()
    x.arc(cx, cy, r * (2.6 + glow), 0, TAU)
    x.fill()
    x.restore()
  }
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.beginPath()
  const n = 44
  for (let i = 0; i <= n; i++) {
    const ang = (i / n) * TAU
    const rr = r * (1 + n1(ang * 2.2 + t * 0.02, 9) * 0.012)
    const px = cx + Math.cos(ang) * rr
    const py = cy + Math.sin(ang) * rr
    if (i === 0) x.moveTo(px, py)
    else x.lineTo(px, py)
  }
  x.closePath()
  x.fillStyle = `rgba(190,46,32,${(o.tone ?? 0.92) * a})`
  x.fill()
  x.restore()
}

// 飞鸟：两笔，一笔起一笔收，翅膀随相位收张
export function bird(x: CanvasRenderingContext2D, cx: number, cy: number, s: number, phase: number, tone = 0.7, alpha = 1): void {
  const flap = Math.sin(phase) * 0.5 + 0.5
  const wy = s * (0.12 + flap * 0.34)
  pen(x, [[cx - s, cy - wy * 0.35], [cx - s * 0.35, cy - wy], [cx, cy + wy * 0.12], [cx + s * 0.38, cy - wy * 0.92], [cx + s, cy - wy * 0.28]], {
    tone,
    alpha,
    w: Math.max(1.1, s * 0.07),
    head: 0.3,
    tail: 0.5,
    dry: 0.5,
    bristle: 2,
    seed: Math.round(cx),
    tip: 0.2,
  })
}

// ── 城 ────────────────────────────────────────────────────────────────
// 屋顶：一条上翘的弧，墨压得住
function roof(x: CanvasRenderingContext2D, cx: number, y: number, w: number, h: number, tone: number, reveal: number, seed: number): void {
  if (reveal <= 0) return
  const r = clamp01(reveal)
  const half = w / 2
  const lift = h * 0.55
  // 左坡
  pen(x, [
    [cx - half, y - h * 0.1],
    [cx - half * 0.55, y + h * 0.55],
    [cx, y + h],
  ], { tone, w: Math.max(1.6, w * 0.055), head: 0.05, tail: 0.25, dry: 0.55, bristle: 3, seed: seed + 1, reveal: clamp01(r * 1.6), tip: 0.1 })
  if (r < 0.55) return
  // 右坡
  pen(x, [
    [cx, y + h],
    [cx + half * 0.55, y + h * 0.55],
    [cx + half, y - h * 0.1],
  ], { tone, w: Math.max(1.6, w * 0.055), head: 0.05, tail: 0.25, dry: 0.55, bristle: 3, seed: seed + 2, reveal: clamp01((r - 0.45) * 3), tip: 0.1 })
  // 起翘的檐角
  if (r > 0.8) {
    const k = clamp01((r - 0.8) * 5)
    pen(x, [[cx - half, y - h * 0.1], [cx - half - w * 0.06, y - h * 0.1 - lift * 0.45]], { tone: tone * 0.95, w: 1.6, head: 0.2, tail: 0.6, bristle: 2, seed: seed + 3, reveal: k, tip: 0.1 })
    pen(x, [[cx + half, y - h * 0.1], [cx + half + w * 0.06, y - h * 0.1 - lift * 0.45]], { tone: tone * 0.95, w: 1.6, head: 0.2, tail: 0.6, bristle: 2, seed: seed + 4, reveal: k, tip: 0.1 })
  }
}

function house(x: CanvasRenderingContext2D, cx: number, base: number, w: number, h: number, t: number, tone: number, seed: number): void {
  const wall = ss(0, 0.55, t)
  const rf = ss(0.5, 1, t)
  if (wall <= 0) return
  // 墙：淡淡一抹，不是白墙是「有墙」
  const g = x.createLinearGradient(0, base - h, 0, base)
  g.addColorStop(0, ink(tone * 0.35, 0.5 * wall))
  g.addColorStop(1, ink(tone * 0.2, 0.24 * wall))
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = g
  x.fillRect(cx - w / 2, base - h, w, h)
  x.restore()
  // 柱
  pen(x, [[cx - w / 2, base - h * 0.02], [cx - w / 2, base - h]], { tone: tone * 0.8, w: 1.5, alpha: 0.7 * wall, bristle: 0, seed: seed + 5, tip: 0.1 })
  pen(x, [[cx + w / 2, base - h * 0.02], [cx + w / 2, base - h]], { tone: tone * 0.8, w: 1.5, alpha: 0.7 * wall, bristle: 0, seed: seed + 6, tip: 0.1 })
  roof(x, cx, base - h, w * 1.22, h * 0.42, tone, rf, seed)
}

function pagoda(x: CanvasRenderingContext2D, cx: number, base: number, s: number, t: number, tone: number, seed: number): void {
  const tiers = 5
  for (let i = 0; i < tiers; i++) {
    const tt = clamp01((t - i * 0.14) / 0.45)
    if (tt <= 0) continue
    const y = base - (i + 0.35) * s * 1.05
    const w = s * (2.15 - i * 0.3)
    // 塔身
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.fillStyle = ink(tone * 0.42, 0.3 * tt)
    x.fillRect(cx - w * 0.3, y - s * 0.62, w * 0.6, s * 0.62)
    x.restore()
    roof(x, cx, y, w, s * 0.42, tone * 0.9, tt, seed + i * 7)
  }
  // 塔尖
  const topT = clamp01((t - tiers * 0.14) / 0.3)
  if (topT > 0) {
    pen(x, [[cx, base - tiers * 1.05 * s - s * 0.1], [cx, base - tiers * 1.05 * s - s * 0.9]], { tone: tone * 0.95, w: 2.2, head: 0.05, tail: 0.7, bristle: 2, seed: seed + 99, reveal: topT, tip: 0.2 })
  }
}

// 一座城：从城门起，逐步长满山谷
export function city(
  x: CanvasRenderingContext2D,
  o: { cx: number; base: number; scale: number; t: number; tone?: number; seed?: number; lights?: number },
): void {
  const tone = o.tone ?? 0.75
  const seed = o.seed ?? 31
  const t = clamp01(o.t)
  const s = o.scale
  const n = 26
  // 城墙
  const wallT = ss(0, 0.4, t)
  if (wallT > 0) {
    const wl = o.cx - 620 * s
    const wr = o.cx + 640 * s
    pen(x, [[wl, o.base], [wl + 40 * s, o.base - 26 * s], [wr - 40 * s, o.base - 26 * s], [wr, o.base]], {
      tone: tone * 0.85, w: 3.2 * s, head: 0.02, tail: 0.02, dry: 0.35, bristle: 4, seed: seed + 1, reveal: wallT, tip: 0,
    })
    // 城门楼
    house(x, o.cx, o.base - 26 * s, 120 * s, 90 * s, clamp01(t * 1.6), tone, seed + 2)
  }
  // 塔
  pagoda(x, o.cx - 260 * s, o.base - 26 * s, 46 * s, clamp01((t - 0.12) / 0.6), tone, seed + 3)
  // 民居：左右成片
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1
    const d = range(seed + 10, i, 0.1, 1)
    const px = o.cx + side * (120 + d * 620) * s * range(seed + 11, i, 0.7, 1.15)
    const hh = range(seed + 12, i, 26, 62) * s
    const ww = range(seed + 13, i, 52, 110) * s
    const start = 0.18 + rnd(seed + 14, i) * 0.45
    const lt = clamp01((t - start) / 0.42)
    if (lt <= 0) continue
    house(x, px, o.base - 8 * s * (1 + d), ww, hh, lt, tone * range(seed + 15, i, 0.8, 1.05), seed + i * 3)
  }
  // 灯
  if ((o.lights ?? 0) > 0) {
    x.save()
    x.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 60; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const d = rnd(seed + 20, i)
      if (d > o.lights!) continue
      const px = o.cx + side * (140 + d * 600) * s
      const py = o.base - range(seed + 21, i, 10, 46) * s
      const a = 0.35 + rnd(seed + 22, i) * 0.5
      x.fillStyle = `rgba(226,170,52,${a})`
      x.beginPath()
      x.arc(px, py, Math.max(1.2, 2.6 * s), 0, TAU)
      x.fill()
    }
    x.restore()
  }
}

// ── 舟与人 ────────────────────────────────────────────────────────────
export function boat(
  x: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  o: { tone?: number; rot?: number; canopy?: boolean; lantern?: number; t?: number; seed?: number } = {},
): void {
  const tone = o.tone ?? 0.8
  const seed = o.seed ?? 3
  const t = o.t ?? 0
  x.save()
  x.translate(cx, cy)
  x.rotate(o.rot ?? 0)
  // 船身：一横一弧，像一弯月
  pen(x, [[-1 * s, -0.02 * s], [-0.62 * s, 0.16 * s], [0.1 * s, 0.24 * s], [0.66 * s, 0.14 * s], [1 * s, -0.06 * s]], {
    tone, w: Math.max(2, s * 0.05), head: 0.08, tail: 0.3, dry: 0.35, bristle: 3, seed: seed + 1, tip: 0.2,
  })
  // 船舷内侧
  pen(x, [[-0.86 * s, -0.06 * s], [-0.2 * s, 0.02 * s], [0.8 * s, -0.1 * s]], {
    tone: tone * 0.8, w: Math.max(1.2, s * 0.02), head: 0.2, tail: 0.4, bristle: 2, seed: seed + 2, alpha: 0.8, tip: 0.1,
  })
  if (o.canopy !== false) {
    pen(x, [[-0.42 * s, -0.04 * s], [-0.34 * s, -0.34 * s], [0.02 * s, -0.42 * s], [0.36 * s, -0.3 * s], [0.42 * s, -0.02 * s]], {
      tone: tone * 0.9, w: Math.max(1.6, s * 0.035), head: 0.06, tail: 0.12, dry: 0.3, bristle: 3, seed: seed + 3, tip: 0.1,
    })
    // 篷的苇纹
    for (let i = 0; i < 5; i++) {
      const q = (i + 0.5) / 5
      pen(x, [[lerp(-0.36, 0.38, q) * s, -0.04 * s - Math.sin(q * Math.PI) * 0.02 * s], [lerp(-0.3, 0.3, q) * s, -0.36 * s - Math.sin(q * Math.PI) * 0.06 * s]], {
        tone: tone * 0.6, w: 1.1, alpha: 0.35, bristle: 0, seed: seed + 4 + i, tip: 0,
      })
    }
  }
  if (o.lantern) {
    const lx = -0.6 * s
    const ly = -0.36 * s
    x.save()
    x.globalCompositeOperation = 'lighter'
    const g = x.createRadialGradient(lx, ly, 0, lx, ly, s * 0.5)
    g.addColorStop(0, `rgba(255,206,110,${0.75 * o.lantern})`)
    g.addColorStop(0.35, `rgba(240,168,60,${0.35 * o.lantern})`)
    g.addColorStop(1, 'rgba(226,170,52,0)')
    x.fillStyle = g
    x.beginPath()
    x.arc(lx, ly, s * 0.5, 0, TAU)
    x.fill()
    x.restore()
    x.save()
    x.fillStyle = `rgba(226,160,56,${0.95 * o.lantern})`
    x.beginPath()
    x.arc(lx, ly, Math.max(1.5, s * 0.03), 0, TAU)
    x.fill()
    x.restore()
    if (t > 0) lightPath(x, lx, ly + s * 0.06, ly + s * 0.9, s * 0.035, t, seed, o.lantern)
  }
  x.restore()
}

// 舟尾的撑船人：从背后看，只有斗笠、肩、和一根篙
export function boatman(
  x: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  o: { tone?: number; lean?: number; pole?: number; arm?: number } = {},
): void {
  const tone = o.tone ?? 0.85
  const lean = o.lean ?? 0
  x.save()
  x.translate(cx, cy)
  x.rotate(lean * 0.1)
  // 袍：一块立着的墨，肩窄下摆宽
  const body = new Path2D()
  body.moveTo(-0.16 * s, -0.95 * s)
  body.quadraticCurveTo(0.1 * s, -0.62 * s, 0.2 * s, -0.02 * s)
  body.lineTo(-0.24 * s, -0.02 * s)
  body.quadraticCurveTo(-0.34 * s, -0.6 * s, -0.2 * s, -0.95 * s)
  body.closePath()
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = ink(tone * 0.72, 0.9)
  x.fill(body)
  x.restore()
  // 斗笠
  pen(x, [[-0.42 * s, -1.02 * s], [-0.1 * s, -1.24 * s], [0.36 * s, -1.02 * s]], {
    tone, w: Math.max(2.4, s * 0.09), head: 0.1, tail: 0.12, dry: 0.2, bristle: 3, seed: 77, tip: 0.2,
  })
  pen(x, [[-0.36 * s, -1.04 * s], [0, -1.1 * s], [0.3 * s, -1.04 * s]], { tone: tone * 0.6, w: Math.max(1, s * 0.02), alpha: 0.6, bristle: 0, seed: 78, tip: 0 })
  // 肩
  pen(x, [[-0.24 * s, -0.94 * s], [0, -0.99 * s], [0.22 * s, -0.93 * s]], { tone: tone * 0.9, w: Math.max(1.4, s * 0.03), head: 0.2, tail: 0.3, bristle: 2, seed: 79, tip: 0.1 })
  // 篙
  if (o.pole) {
    pen(x, [[0.1 * s, -0.8 * s], [0.5 * s, -0.1 * s], [0.9 * s, 0.5 * s]], {
      tone: tone * 0.8, w: Math.max(1.2, s * 0.018), head: 0.02, tail: 0.3, dry: 0.4, bristle: 2, seed: 80, reveal: clamp01(o.pole), tip: 0,
    })
  }
  if (o.arm) {
    pen(x, [[0.06 * s, -0.86 * s], [0.24 * s, -0.78 * s], [0.34 * s, -0.7 * s]], { tone: tone * 0.7, w: Math.max(1.2, s * 0.024), head: 0.3, tail: 0.4, bristle: 2, seed: 81, reveal: clamp01(o.arm), tip: 0 })
  }
  x.restore()
}

// 水面倒影：纸色的竖向碎笔，只在水里
export function reflection(x: CanvasRenderingContext2D, cx: number, y0: number, h: number, w: number, t: number, seed = 7, alpha = 0.5): void {
  x.save()
  x.globalCompositeOperation = 'source-over'
  for (let i = 0; i < 42; i++) {
    const q = i / 42
    const y = y0 + q * h
    const jx = Math.sin(t * 2.2 + i * 0.8 + seed) * w * 0.5
    const len = h / 42 * range(seed, i, 0.6, 1.4)
    x.fillStyle = `rgba(239,230,208,${alpha * (1 - q) * range(seed + 1, i, 0.3, 1)})`
    x.fillRect(cx + jx - w * 0.06, y, w * (0.06 + 0.1 * rnd(seed + 2, i)), Math.max(0.8, len * 0.5))
  }
  x.restore()
}
