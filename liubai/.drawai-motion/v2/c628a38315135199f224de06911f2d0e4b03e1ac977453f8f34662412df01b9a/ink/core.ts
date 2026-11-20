// 水墨原语底层：确定性噪声、缓动、颜色、画布池。
// 全片禁止 Math.random()：同一帧必须永远画出同一张画。

export const W = 1920
export const H = 1080
export const TAU = Math.PI * 2

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const invLerp = (a: number, b: number, v: number): number => (b - a === 0 ? 0 : clamp01((v - a) / (b - a)))

// 平滑阶跃：墨色过渡一律走它，不要线性，线性会「像滑块」。
export const ss = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a || 1e-6))
  return t * t * (3 - 2 * t)
}

export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3)
export const easeIn = (t: number): number => Math.pow(clamp01(t), 2.6)
export const easeInOut = (t: number): number => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
// 指数趋近：镜头/呼吸用它，永远到不了 1，所以不会「停住」。
export const expo = (t: number, k = 5): number => (1 - Math.exp(-clamp01(t) * k)) / (1 - Math.exp(-k))

export function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

export const rnd = (seed: number, i: number): number => hash(Math.imul(seed + 1, 374761393) ^ Math.imul(i + 1, 668265263))
export const range = (seed: number, i: number, a: number, b: number): number => a + (b - a) * rnd(seed, i)
export const pick = <T,>(seed: number, i: number, list: T[]): T => list[Math.floor(rnd(seed, i) * list.length) % list.length]

// 1D 值噪声
export function n1(x: number, seed = 0): number {
  const i = Math.floor(x)
  const f = x - i
  const a = rnd(seed, i)
  const b = rnd(seed, i + 1)
  const t = f * f * (3 - 2 * f)
  return (a + (b - a) * t) * 2 - 1
}

export function fbm(x: number, seed = 0, oct = 4, gain = 0.5, lac = 2.03): number {
  let s = 0
  let amp = 0.5
  let sum = 0
  for (let o = 0; o < oct; o++) {
    s += n1(x * Math.pow(lac, o), seed + o * 37) * amp
    sum += amp
    amp *= gain
  }
  return s / Math.max(1e-6, sum)
}

// 山脊用的分形：低频给大势，高频给碎石。返回 -1..1
export function ridgeNoise(x: number, seed: number, oct = 5): number {
  let s = 0
  let amp = 1
  let sum = 0
  let f = 1
  for (let o = 0; o < oct; o++) {
    s += Math.abs(n1(x * f + o * 11.7, seed + o * 91)) * amp
    sum += amp
    amp *= 0.52
    f *= 2.07
  }
  return (s / sum) * 2 - 1
}

// 2D 值噪声（云气 / 飞白 / 纸纹）
export function n2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const h = (a: number, b: number): number => rnd(seed, a * 7919 + b * 104729)
  const a = h(xi, yi)
  const b = h(xi + 1, yi)
  const c = h(xi, yi + 1)
  const d = h(xi + 1, yi + 1)
  return lerp(lerp(a, b, u), lerp(c, d, u), v)
}

// ── 颜色：墨只有一个色，靠 tone 分五色 ────────────────────────────────
export const INK_RGB = [16, 14, 12] as const
export const PAPER_RGB = [239, 230, 208] as const
export const SURFACE_RGB = [247, 241, 226] as const

export const ink = (tone = 1, alpha = 1): string =>
  `rgba(16,14,12,${clamp(tone, 0, 1) * clamp(alpha, 0, 1)})`

export const paperC = (alpha = 1): string => `rgba(239,230,208,${clamp01(alpha)})`
export const surfaceC = (alpha = 1): string => `rgba(247,241,226,${clamp01(alpha)})`

export function mixRGB(a: readonly number[], b: readonly number[], t: number): string {
  const k = clamp01(t)
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`
}

// ── 画布池 ────────────────────────────────────────────────────────────
export const makeCanvas = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w))
  c.height = Math.max(1, Math.round(h))
  return c
}

export const ctx2d = (c: HTMLCanvasElement): CanvasRenderingContext2D => {
  const x = c.getContext('2d')
  if (!x) throw new Error('canvas 2d unavailable')
  return x
}

const pool = new Map<string, HTMLCanvasElement>()

// 复用离屏画布：每帧新建 1920×1080 会把 GC 拖垮。
export function scratch(key: string, w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const cw = Math.max(1, Math.ceil(w))
  const ch = Math.max(1, Math.ceil(h))
  let c = pool.get(key)
  if (!c || c.width < cw || c.height < ch) {
    c = makeCanvas(cw, ch)
    pool.set(key, c)
  }
  const ctx = ctx2d(c)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.filter = 'none'
  ctx.clearRect(0, 0, c.width, c.height)
  return [c, ctx]
}

// 半分辨率柔化层：晕染不需要分辨率，需要的是「软」。
export function softLayer(
  key: string,
  w: number,
  h: number,
  scale: number,
  blur: number,
  draw: (c: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const [c, ctx] = scratch(key, w * scale, h * scale)
  ctx.save()
  ctx.scale(scale, scale)
  draw(ctx)
  ctx.restore()
  if (blur > 0) {
    // 柔化在上层做，避免每帧 build 滤镜图
  }
  return c
}

export function blurCanvas(src: HTMLCanvasElement, blurPx: number): HTMLCanvasElement {
  if (blurPx <= 0.05) return src
  const [c, ctx] = scratch('blur:' + src.width + 'x' + src.height, src.width, src.height)
  ctx.filter = `blur(${blurPx}px)`
  ctx.drawImage(src, 0, 0)
  ctx.filter = 'none'
  return c
}

// 把 offscreen 画到主画布上（乘算，墨只加深纸）
export function blend(
  dst: CanvasRenderingContext2D,
  src: HTMLCanvasElement,
  w: number,
  h: number,
  alpha = 1,
  op: GlobalCompositeOperation = 'multiply',
): void {
  dst.save()
  dst.globalCompositeOperation = op
  dst.globalAlpha = alpha
  dst.drawImage(src, 0, 0, w, h)
  dst.restore()
}
