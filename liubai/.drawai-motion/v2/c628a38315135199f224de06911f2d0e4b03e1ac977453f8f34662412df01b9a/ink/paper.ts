// 纸：整幅唯一底色。任何场景都从这一张纸上开始，不许出现纯白 / 纯黑。
import { W, H, rnd, range, scratch, ctx2d, makeCanvas, paperC, ink, clamp01, lerp, n2 } from './core'

let paper: HTMLCanvasElement | null = null
let paperPaper: HTMLCanvasElement | null = null

// 纸面：宣纸底色 + 2600 根纸纤维 + 云斑 + 四角暗角。
export function getPaper(): HTMLCanvasElement {
  if (paper) return paper
  const c = makeCanvas(W, H)
  const x = ctx2d(c)
  x.fillStyle = '#EFE6D0'
  x.fillRect(0, 0, W, H)

  // 云斑：极淡的干湿不匀，让底色不是一块死板子
  for (let i = 0; i < 46; i++) {
    const cx = range(11, i, -100, W + 100)
    const cy = range(12, i, -80, H + 80)
    const r = range(13, i, 120, 620)
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    const a = range(14, i, 0.012, 0.045)
    g.addColorStop(0, `rgba(122,104,78,${a})`)
    g.addColorStop(1, 'rgba(122,104,78,0)')
    x.fillStyle = g
    x.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  // 纸纤维：长短两套，短的是絮，长的是筋
  x.lineCap = 'round'
  for (let i = 0; i < 2600; i++) {
    const px = range(21, i, -20, W + 20)
    const py = range(22, i, -20, H + 20)
    const long = i % 11 === 0
    const len = long ? range(23, i, 40, 150) : range(24, i, 3, 26)
    const ang = range(25, i, -0.35, 0.35) + (long ? range(26, i, -0.25, 0.25) : 0)
    const bright = i % 3 === 0
    x.strokeStyle = bright ? `rgba(255,249,235,${range(27, i, 0.05, 0.16)})` : `rgba(106,88,62,${range(28, i, 0.02, 0.075)})`
    x.lineWidth = long ? range(29, i, 0.5, 1.1) : range(30, i, 0.4, 0.9)
    const bend = range(31, i, -0.25, 0.25)
    x.beginPath()
    x.moveTo(px, py)
    x.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 - Math.sin(ang) * len * bend, py + Math.sin(ang) * len * 0.5 + Math.cos(ang) * len * bend, px + Math.cos(ang) * len, py + Math.sin(ang) * len)
    x.stroke()
  }

  // 细斑点（陈纸的杂质）
  for (let i = 0; i < 520; i++) {
    const px = range(41, i, 0, W)
    const py = range(42, i, 0, H)
    const r = range(43, i, 0.4, 1.5)
    x.fillStyle = `rgba(96,78,54,${range(44, i, 0.03, 0.1)})`
    x.beginPath()
    x.arc(px, py, r, 0, Math.PI * 2)
    x.fill()
  }

  // 四角暗角：α .22，只压边，中间不动
  const vig = ctx2d(makeCanvas(W, H))
  const g = vig.createRadialGradient(W * 0.5, H * 0.47, H * 0.30, W * 0.5, H * 0.5, W * 0.72)
  g.addColorStop(0, 'rgba(60,46,26,0)')
  g.addColorStop(0.62, 'rgba(60,46,26,0.05)')
  g.addColorStop(1, 'rgba(48,36,20,0.22)')
  vig.fillStyle = g
  vig.fillRect(0, 0, W, H)
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.drawImage(vig.canvas, 0, 0)
  x.restore()

  paper = c
  return c
}

// 一层「更白的纸」：用于留白处、被光照到的边。
export function getPaperBright(): HTMLCanvasElement {
  if (paperPaper) return paperPaper
  const c = makeCanvas(W, H)
  const x = ctx2d(c)
  const g = x.createRadialGradient(W * 0.5, H * 0.44, 60, W * 0.5, H * 0.5, W * 0.62)
  g.addColorStop(0, 'rgba(250,245,232,1)')
  g.addColorStop(0.55, 'rgba(245,238,220,0.95)')
  g.addColorStop(1, 'rgba(233,222,198,0.9)')
  x.fillStyle = g
  x.fillRect(0, 0, W, H)
  paperPaper = c
  return c
}

// ── 胶片颗粒：预生成 4 张噪点瓦片，逐帧换偏移 ────────────────────────
const tiles: HTMLCanvasElement[] = []
const patterns = new WeakMap<CanvasRenderingContext2D, CanvasPattern[]>()

function buildTile(seed: number): HTMLCanvasElement {
  const s = 128
  const c = makeCanvas(s, s)
  const x = ctx2d(c)
  const img = x.createImageData(s, s)
  const d = img.data
  for (let i = 0; i < s * s; i++) {
    const v = rnd(seed, i)
    const g = v > 0.5 ? 255 : 0
    d[i * 4] = g
    d[i * 4 + 1] = g
    d[i * 4 + 2] = g
    d[i * 4 + 3] = Math.round(Math.abs(v - 0.5) * 2 * 255 * 0.9)
  }
  x.putImageData(img, 0, 0)
  return c
}

export function drawGrain(x: CanvasRenderingContext2D, frame: number, amount = 0.05, salt = 3): void {
  if (tiles.length === 0) for (let i = 0; i < 4; i++) tiles.push(buildTile(900 + i))
  let pats = patterns.get(x)
  if (!pats) {
    pats = tiles.map((t) => x.createPattern(t, 'repeat') as CanvasPattern)
    patterns.set(x, pats)
  }
  const ox = Math.floor(rnd(salt, frame) * 128)
  const oy = Math.floor(rnd(salt + 1, frame) * 128)
  const pat = pats[frame % 4]
  x.save()
  x.globalCompositeOperation = 'overlay'
  x.globalAlpha = amount
  x.translate(-ox, -oy)
  x.fillStyle = pat
  x.fillRect(0, 0, W + 128, H + 128)
  x.restore()
}

// 纸的呼吸：整幅随帧极轻微明暗，防止大平面「死」
export function paperBreath(x: CanvasRenderingContext2D, frame: number): void {
  const k = n2(frame * 0.011, 0.5, 41) - 0.5
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = paperC(1)
  x.globalAlpha = 0
  x.restore()
  if (Math.abs(k) < 0.001) return
  x.save()
  x.globalCompositeOperation = 'source-over'
  x.fillStyle = k > 0 ? `rgba(247,241,226,${k * 0.05})` : `rgba(90,70,44,${-k * 0.04})`
  x.fillRect(0, 0, W, H)
  x.restore()
}

// 湿边：墨晕最外圈比本体深一点点，是「水推着墨走」的痕迹。
export function wetEdge(x: CanvasRenderingContext2D, path: Path2D, w: number, alpha: number): void {
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.strokeStyle = ink(0.55, alpha)
  x.lineWidth = w
  x.filter = `blur(${Math.max(0.6, w * 0.5)}px)`
  x.stroke(path)
  x.filter = 'none'
  x.restore()
}

export function vignettePulse(x: CanvasRenderingContext2D, k: number): void {
  if (k <= 0.001) return
  x.save()
  x.globalCompositeOperation = 'multiply'
  const g = x.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, W * 0.7)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(30,22,12,${clamp01(k)})`)
  x.fillStyle = g
  x.fillRect(0, 0, W, H)
  x.restore()
}

// 全屏纸色叠层（用于擦除、闪白）
export function paperWash(x: CanvasRenderingContext2D, a: number): void {
  if (a <= 0) return
  x.save()
  x.globalAlpha = clamp01(a)
  x.fillStyle = '#EFE6D0'
  x.fillRect(0, 0, W, H)
  x.restore()
}

export function inkFade(x: CanvasRenderingContext2D, a: number): void {
  if (a <= 0) return
  x.save()
  x.globalAlpha = clamp01(a)
  x.fillStyle = `rgb(${lerp(30, 12, clamp01(a))},${lerp(26, 10, clamp01(a))},${lerp(20, 8, clamp01(a))})`
  x.fillRect(0, 0, W, H)
  x.restore()
}
