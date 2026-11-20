// 毛笔：全片每一根线都是笔。Catmull-Rom 加密 → 4px 等弧长重采样 → 双沿带 → 逐根笔毛。
import { W, H, TAU, clamp, clamp01, ink, lerp, rnd, n1, scratch, ss, easeOut, range } from './core'

export type Pt = [number, number]

export function catmullRom(pts: Pt[], seg = 12): Pt[] {
  if (pts.length < 2) return pts.slice()
  if (pts.length === 2) return [pts[0], pts[1]]
  const p: Pt[] = [pts[0], ...pts, pts[pts.length - 1]]
  const out: Pt[] = []
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2]
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1])
    const n = clamp(Math.ceil(len / seg), 2, 64)
    for (let j = 0; j < n; j++) {
      const t = j / n
      const t2 = t * t
      const t3 = t2 * t
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

export function resample(pts: Pt[], step = 4): Pt[] {
  if (pts.length < 2) return pts.slice()
  const out: Pt[] = [pts[0]]
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    let ax = pts[i - 1][0]
    let ay = pts[i - 1][1]
    const bx = pts[i][0]
    const by = pts[i][1]
    let segLen = Math.hypot(bx - ax, by - ay)
    while (acc + segLen >= step) {
      const t = (step - acc) / segLen
      ax = ax + (bx - ax) * t
      ay = ay + (by - ay) * t
      out.push([ax, ay])
      segLen = Math.hypot(bx - ax, by - ay)
      acc = 0
    }
    acc += segLen
  }
  const last = pts[pts.length - 1]
  const outLast = out[out.length - 1]
  if (Math.hypot(last[0] - outLast[0], last[1] - outLast[1]) > step * 0.4) out.push(last)
  return out
}

export function normals(pts: Pt[]): Pt[] {
  const n: Pt[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    n.push([-dy / l, dx / l])
  }
  return n
}

export const profile = (q: number, head = 0.12, tail = 0.18): number =>
  ss(0, head, q) * (1 - 0.72 * ss(1 - tail, 1, q))

export type PenOpts = {
  tone?: number
  alpha?: number
  w?: number
  head?: number
  tail?: number
  dry?: number
  bristle?: number
  seed?: number
  reveal?: number
  wobble?: number
  halo?: number
  bristleA?: number
  tip?: number
}

// 笔毛带：左右两条沿返回一个闭合 Path2D
export function ribbon(s: Pt[], nm: Pt[], halfW: (q: number) => number, from = 0, to = 1): Path2D {
  const p = new Path2D()
  const i0 = Math.floor(from * (s.length - 1))
  const i1 = Math.ceil(to * (s.length - 1))
  if (i1 <= i0) return p
  const denom = Math.max(1, s.length - 1)
  for (let i = i0; i <= i1; i++) {
    const q = i / denom
    const w = halfW(q)
    const px = s[i][0] + nm[i][0] * w
    const py = s[i][1] + nm[i][1] * w
    if (i === i0) p.moveTo(px, py)
    else p.lineTo(px, py)
  }
  for (let i = i1; i >= i0; i--) {
    const q = i / denom
    const w = halfW(q)
    p.lineTo(s[i][0] - nm[i][0] * w, s[i][1] - nm[i][1] * w)
  }
  p.closePath()
  return p
}

// 一笔。tone 五色：焦 .9 / 浓 .8 / 重 .6 / 淡 .35 / 清 .15
export function pen(x: CanvasRenderingContext2D, pts: Pt[], o: PenOpts = {}): void {
  const tone = o.tone ?? 0.8
  const alpha = o.alpha ?? 1
  const w = o.w ?? 12
  const seed = o.seed ?? 7
  const reveal = o.reveal ?? 1
  if (reveal <= 0 || pts.length < 2) return

  const curve = resample(catmullRom(pts, Math.max(4, Math.min(18, w * 0.8))), 4)
  if (curve.length < 2) return
  const nm = normals(curve)
  const n = curve.length

  // 手抖：只在长笔上给一点点，短笔给抖会脏
  if (o.wobble) {
    for (let i = 0; i < n; i++) {
      const q = i / (n - 1)
      const k = n1(q * 3.1 + seed * 0.7, seed) * o.wobble
      curve[i] = [curve[i][0] + nm[i][0] * k, curve[i][1] + nm[i][1] * k]
    }
  }

  const head = o.head ?? 0.1
  const tail = o.tail ?? 0.16
  const half = (q: number): number => (w * 0.5 * profile(q, head, tail) * (0.86 + 0.14 * (n1(q * 5 + seed, seed + 3) * 0.5 + 0.5)))
  const cut = clamp01(reveal)
  const to = cut

  x.save()
  x.globalCompositeOperation = 'multiply'

  // 墨体
  const body = ribbon(curve, nm, half, 0, to)
  x.fillStyle = ink(tone, alpha)
  x.fill(body)

  // 笔毛：一根毛一条连续 path，按噪声断开出飞白；绝不能分段 stroke（会叠出竹节）
  const bristle = o.bristle ?? Math.round(clamp(w * 0.7, 2, 46))
  if (bristle > 0) {
    const bw = Math.max(0.6, Math.min(2.4, w * 0.035))
    x.lineWidth = bw
    x.lineCap = 'butt'
    x.strokeStyle = ink(tone * 0.96, (o.bristleA ?? 0.55) * alpha)
    x.beginPath()
    const dry = o.dry ?? 0.35
    const iEnd = Math.floor(to * (n - 1))
    for (let k = 0; k < bristle; k++) {
      const off = (bristle === 1 ? 0 : k / (bristle - 1) - 0.5) * 0.94
      let open = false
      for (let i = 0; i <= iEnd; i++) {
        const q = i / Math.max(1, n - 1)
        const vis = n1(i * 0.055 + k * 4.31 + seed * 1.37, seed + k * 13)
        const gap = vis < dry * 1.35 - 0.52 || (q > 0.9 && rnd(seed + k, Math.floor(q * 400)) < 0.35)
        if (gap) {
          open = false
          continue
        }
        const hw = half(q)
        const edge = off * 0.46 + (off > 0 ? 0.02 : -0.02)
        const px = curve[i][0] + nm[i][0] * hw * 2 * edge
        const py = curve[i][1] + nm[i][1] * hw * 2 * edge
        if (!open) {
          x.moveTo(px, py)
          open = true
        } else x.lineTo(px, py)
      }
    }
    x.stroke()
  }

  // 笔尖余墨：落笔/收笔处的小团，让线头是「点」不是「切面」
  if (o.tip !== 0) {
    const iEnd = Math.floor(to * (n - 1))
    const tipA = (o.tip ?? 0.5) * alpha * ss(0.02, 0.4, cut)
    if (tipA > 0.01) {
      x.fillStyle = ink(tone * 0.95, tipA * 0.7)
      x.beginPath()
      x.arc(curve[iEnd][0], curve[iEnd][1], Math.max(0.8, half(cut) * 0.72), 0, TAU)
      x.fill()
    }
  }
  x.restore()
}

// 晕染：把某块墨放进半分辨率层里模糊，再乘回纸面。grow 是「洇开」的倍率。
export function wash(
  x: CanvasRenderingContext2D,
  key: string,
  draw: (c: CanvasRenderingContext2D) => void,
  opts: { scale?: number; blur?: number; grow?: number; alpha?: number } = {},
): void {
  const scale = opts.scale ?? 0.5
  const blur = opts.blur ?? 6
  const grow = Math.max(1, opts.grow ?? 1)
  const alpha = opts.alpha ?? 0.55
  const [c, cx] = scratch(key, W * scale, H * scale)
  cx.save()
  cx.scale(scale, scale)
  draw(cx)
  cx.restore()
  const gw = W * grow
  const gh = H * grow
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.globalAlpha = alpha
  x.filter = `blur(${Math.max(0.4, blur)}px)`
  x.drawImage(c, (W - gw) / 2, (H - gh) / 2, gw, gh)
  x.filter = 'none'
  x.restore()
}

export function blob(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, tone = 0.7, alpha = 1, seed = 1, wobble = 0.18): void {
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.beginPath()
  const n = 26
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU
    const k = 1 + n1(a * 1.7 + seed, seed) * wobble + n1(a * 4.3 + seed, seed + 9) * wobble * 0.4
    const px = cx + Math.cos(a) * r * k
    const py = cy + Math.sin(a) * r * k
    if (i === 0) x.moveTo(px, py)
    else x.lineTo(px, py)
  }
  x.closePath()
  x.fillStyle = ink(tone, alpha)
  x.fill()
  x.restore()
}

// 墨点飞溅：溅的不是圆，是带方向的小钩子
export function splatter(x: CanvasRenderingContext2D, cx: number, cy: number, t: number, seed = 3, amount = 70, spread = 1, tone = 0.85): void {
  if (t <= 0) return
  x.save()
  x.globalCompositeOperation = 'multiply'
  for (let i = 0; i < amount; i++) {
    const ang = rnd(seed, i) * TAU
    const v = range(seed + 1, i, 0.25, 1.0)
    const life = 0.55 + rnd(seed + 2, i) * 0.65
    const tt = clamp01(t / life)
    if (tt <= 0) continue
    const dist = v * 260 * spread * easeOut(tt)
    const px = cx + Math.cos(ang) * dist
    const py = cy + Math.sin(ang) * dist - 40 * tt * tt * (0.4 + v)
    const r = Math.max(0.4, range(seed + 3, i, 1.2, 5.4) * (1 - tt * 0.35))
    const a = (1 - tt) * range(seed + 4, i, 0.35, 0.95)
    x.fillStyle = ink(tone * range(seed + 5, i, 0.6, 1), a)
    // 尾巴：钩子
    x.beginPath()
    x.ellipse(px, py, r * (1.1 + v * 0.7), r * 0.72, ang, 0, TAU)
    x.fill()
  }
  x.restore()
}

// 墨渗：一圈圈由深到浅的同心晕，模拟水推墨
export function bleedRings(x: CanvasRenderingContext2D, cx: number, cy: number, t: number, seed = 5, maxR = 220, tone = 0.5): void {
  x.save()
  x.globalCompositeOperation = 'multiply'
  for (let i = 0; i < 5; i++) {
    const r = maxR * easeOut(clamp01(t)) * (0.55 + i * 0.13)
    if (r < 1) continue
    const a = (1 - i / 5) * 0.18 * (1 - clamp01(t) * 0.55)
    x.beginPath()
    x.arc(cx, cy, r, 0, TAU)
    x.lineWidth = 2 + i * 2.4
    x.strokeStyle = ink(tone - i * 0.06, a)
    x.stroke()
  }
  x.restore()
}

// ── 题字：墨从纸里渗出来，不是淡入 ────────────────────────────────────
export type TextOpts = {
  size: number
  font?: string
  weight?: number
  tone?: number
  alpha?: number
  align?: 'left' | 'center' | 'right'
  baseline?: 'top' | 'middle'
  reveal?: number
  seed?: number
  spacing?: number
  vertical?: boolean
}

export function inkText(x: CanvasRenderingContext2D, text: string, px: number, py: number, o: TextOpts): void {
  const size = o.size
  const font = `${o.weight ?? 400} ${size}px ${o.font ?? '"Long Cang","Noto Serif SC",serif'}`
  const reveal = clamp01(o.reveal ?? 1)
  if (reveal <= 0.001) return
  const alpha = o.alpha ?? 1

  // 量尺寸（先设字间距）
  x.save()
  x.font = font
  if ('letterSpacing' in x) (x as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing ?? 0}px`
  const chars = o.vertical ? text.split('') : [text]
  const gap = o.spacing ?? 0
  let tw = 0
  let th = size * 1.25
  if (o.vertical) {
    th = chars.length * size * 1.06 + size * 0.3
    tw = Math.max(...chars.map((t) => x.measureText(t).width)) + size * 0.4
  } else {
    tw = x.measureText(text).width + size * 0.3
  }
  const pad = Math.ceil(size * 0.4)
  const cw = Math.ceil(tw + pad * 2)
  const ch = Math.ceil(th + pad * 2)
  const [c, t] = scratch('text:' + Math.ceil(cw) + 'x' + Math.ceil(ch), cw, ch)
  t.font = font
  if ('letterSpacing' in t) (t as unknown as { letterSpacing: string }).letterSpacing = `${gap}px`
  t.textBaseline = 'middle'
  t.textAlign = o.vertical ? 'center' : o.align ?? 'center'
  t.fillStyle = ink(o.tone ?? 0.86, 1)
  if (o.vertical) {
    chars.forEach((ch2, i) => t.fillText(ch2, cw / 2, pad + size * 0.55 + i * size * 1.06))
  } else {
    const tx = o.align === 'left' ? pad : o.align === 'right' ? cw - pad : cw / 2
    t.fillText(text, tx, ch / 2)
  }

  // 渗纸：用扩张的墨点做 mask，字是一点点「洇」出来的
  if (reveal < 1) {
    t.globalCompositeOperation = 'destination-in'
    const count = clamp(Math.round((cw * ch) / (size * size * 0.55)), 90, 720)
    for (let i = 0; i < count; i++) {
      const bx = rnd(o.seed ?? 11, i) * cw
      const by = rnd((o.seed ?? 11) + 1, i) * ch
      const delay = rnd((o.seed ?? 11) + 2, i) * 0.7
      const r = Math.max(0, (reveal * 1.5 - delay) * size * 0.42)
      if (r <= 0) continue
      t.beginPath()
      t.arc(bx, by, r, 0, TAU)
      t.fill()
    }
    t.globalCompositeOperation = 'source-over'
  }

  const drawX = o.align === 'center' ? px - cw / 2 : o.align === 'left' ? px - pad : px - cw + pad
  const drawY = o.baseline === 'top' ? py : py - ch / 2
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.globalAlpha = alpha
  x.drawImage(c, drawX, drawY)
  // 第一笔之后补一层极淡的边，字才「吃」进纸里
  x.globalAlpha = alpha * 0.16
  x.filter = 'blur(1.6px)'
  x.drawImage(c, drawX, drawY)
  x.filter = 'none'
  x.restore()
  x.restore()
}

// ── 钤印：1.5 倍落下、多重乘算、边缘崩口 ──────────────────────────────
export function seal(
  x: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  chars: string[],
  o: { reveal?: number; rot?: number; tone?: number; alpha?: number; seed?: number } = {},
): void {
  const k = o.reveal ?? 1
  if (k <= 0.001) return
  const s = clamp(k < 1.5 ? lerp(size * 1.5, size, easeOut(clamp01(k / 1.5))) : size, size * 0.2, size * 1.5)
  const a = clamp01(k * 1.4)
  const pad = Math.ceil(s * 0.2)
  const [c, t] = scratch('seal:' + Math.ceil(s + pad * 2), s + pad * 2, s + pad * 2)
  const k2 = s / 100
  t.save()
  t.translate(pad, pad)
  t.fillStyle = `rgba(196,40,30,${0.92 * a})`
  // 印面：手刻的方，四边都不直
  t.beginPath()
  const steps = 8
  for (let side = 0; side < 4; side++) {
    for (let i = 0; i < steps; i++) {
      const u = i / steps
      const jx = (rnd(o.seed ?? 3, side * 20 + i) - 0.5) * s * 0.022
      const jy = (rnd((o.seed ?? 3) + 1, side * 20 + i) - 0.5) * s * 0.022
      let px = 0
      let py = 0
      if (side === 0) {
        px = u * s
        py = 0
      } else if (side === 1) {
        px = s
        py = u * s
      } else if (side === 2) {
        px = s - u * s
        py = s
      } else {
        px = 0
        py = s - u * s
      }
      if (side === 0 && i === 0) t.moveTo(px + jx, py + jy)
      else t.lineTo(px + jx, py + jy)
    }
  }
  t.closePath()
  t.fill()
  // 崩口：印泥没沾匀的地方
  t.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 90; i++) {
    const px = rnd(o.seed ?? 5, i) * s
    const py = rnd((o.seed ?? 5) + 1, i) * s
    const r = Math.pow(rnd((o.seed ?? 5) + 2, i), 2) * s * 0.03
    t.globalAlpha = rnd((o.seed ?? 5) + 3, i) * 0.85
    t.beginPath()
    t.arc(px, py, r, 0, TAU)
    t.fill()
  }
  t.globalAlpha = 1
  // 刻字
  t.globalCompositeOperation = 'destination-out'
  t.fillStyle = 'rgba(0,0,0,1)'
  const n = chars.length
  const col = n <= 2 ? 1 : 2
  const rows = Math.ceil(n / col)
  const cellW = (s * 0.86) / col
  const cellH = (s * 0.86) / Math.max(1, rows)
  t.textAlign = 'center'
  t.textBaseline = 'middle'
  t.font = `700 ${cellH * 0.86}px "Noto Serif SC",serif`
  chars.forEach((ch, i) => {
    const cxi = s * 0.07 + cellW * ((i % col) + 0.5)
    const cyi = s * 0.07 + cellH * (Math.floor(i / col) + 0.5)
    t.fillText(ch, cxi, cyi)
  })
  t.restore()

  x.save()
  x.globalCompositeOperation = 'multiply'
  x.translate(cx, cy)
  x.rotate(((o.rot ?? -1.2) * Math.PI) / 180)
  x.globalAlpha = clamp01(o.alpha ?? 1)
  x.drawImage(c, -s / 2 - pad, -s / 2 - pad)
  x.filter = 'blur(0.4px)'
  x.globalAlpha = (o.alpha ?? 1) * 0.5
  x.drawImage(c, -s / 2 - pad, -s / 2 - pad)
  x.filter = 'none'
  x.restore()
}

// 细线：片头署名的分割线，笔尖拖出来的
export function hairline(x: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, reveal: number, seed = 9, tone = 0.5): void {
  if (reveal <= 0) return
  pen(x, [[x0, y0], [lerp(x0, x1, 0.5), (y0 + y1) / 2 + 0.6], [x1, y1]], {
    tone,
    w: 1.6,
    head: 0.04,
    tail: 0.3,
    dry: 0.5,
    bristle: 3,
    seed,
    reveal,
    tip: 0.25,
  })
}

export { lerp }
