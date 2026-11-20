// 人：孤翁。全片唯一一张脸，只给一只眼睛。
// 脸是影，眼睛是光。近景不靠五官堆，靠一只被照亮的眼。
import { TAU, clamp, clamp01, ink, lerp, rnd, range, n1, ss, easeOut, paperC } from './core'
import { pen, blob } from './brush'

export type HeadOpts = {
  s: number // 头高（像素）
  cx: number
  cy: number
  turn?: number // 0 = 背，1 = 正
  look?: number // 眼珠朝镜头偏移
  t?: number
  tone?: number
  light?: number // 侧光强度 0..1
  hatTilt?: number
}

// 眼睛：R = 虹膜半径。所有细节都按 R 缩放，所以从 8px 推到 400px 都不糊。
export function eye(x: CanvasRenderingContext2D, cx: number, cy: number, R: number, o: { open?: number; t?: number; look?: number; reflect?: number; glow?: number; seed?: number } = {}): void {
  const open = clamp01(o.open ?? 1)
  const t = o.t ?? 0
  const look = clamp(o.look ?? 0, -1, 1)
  const detail = clamp01((R - 10) / 40)

  // 眼窝：一层极淡的影，让眼球是「陷进去」的
  const socket = x.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3.4)
  socket.addColorStop(0, ink(0.16, 0.16))
  socket.addColorStop(0.55, ink(0.14, 0.06))
  socket.addColorStop(1, ink(0.14, 0))
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = socket
  x.beginPath()
  x.ellipse(cx, cy, R * 3.6, R * 1.9, 0, 0, TAU)
  x.fill()
  x.restore()

  // 眼裂：上睑从内眦扬到外眦，下睑承住眼白
  const lidOpen = 0.18 + open * 1.02
  const upper = new Path2D()
  upper.moveTo(cx - R * 2.55, cy + R * 0.18)
  upper.bezierCurveTo(cx - R * 1.5, cy - R * lidOpen * 1.22, cx + R * 0.35, cy - R * lidOpen * 1.18, cx + R * 2.35, cy - R * 0.12)
  const lower = new Path2D()
  lower.moveTo(cx + R * 2.35, cy - R * 0.12)
  lower.bezierCurveTo(cx + R * 1.1, cy + R * lidOpen * 0.92, cx - R * 0.95, cy + R * lidOpen * 0.95, cx - R * 2.55, cy + R * 0.18)
  const eyePath = new Path2D()
  eyePath.addPath(upper)
  eyePath.addPath(lower)
  eyePath.closePath()

  // 眼白：比纸略暗一点点，绝不用纯白
  x.save()
  x.clip(eyePath)
  x.globalCompositeOperation = 'multiply'
  x.fillStyle = 'rgba(226,214,190,0.55)'
  x.fillRect(cx - R * 3, cy - R * 3, R * 6, R * 6)
  // 上睑投下的阴影
  const shade = x.createLinearGradient(0, cy - R * 1.4, 0, cy + R * 0.9)
  shade.addColorStop(0, ink(0.5, 0.35))
  shade.addColorStop(0.55, ink(0.3, 0.06))
  shade.addColorStop(1, ink(0.3, 0.18))
  x.fillStyle = shade
  x.fillRect(cx - R * 3, cy - R * 2, R * 6, R * 4)
  x.restore()

  // 虹膜
  const ix = cx + look * R * 0.34
  const iy = cy + R * 0.02
  x.save()
  x.globalCompositeOperation = 'multiply'
  const irisG = x.createRadialGradient(ix, iy, R * 0.1, ix, iy, R * 1.06)
  irisG.addColorStop(0, 'rgba(56,48,40,0.94)')
  irisG.addColorStop(0.42, 'rgba(78,68,56,0.92)')
  irisG.addColorStop(0.78, 'rgba(44,38,31,0.95)')
  irisG.addColorStop(0.94, 'rgba(26,18,12,1)')
  irisG.addColorStop(1, 'rgba(20,14,10,1)')
  x.beginPath()
  x.arc(ix, iy, R, 0, TAU)
  x.fillStyle = irisG
  x.fill()
  x.restore()

  // 虹膜纤维：放射状细纹，越靠外越深
  if (detail > 0.2) {
    const n = Math.round(150 * detail)
    x.save()
    x.globalCompositeOperation = 'multiply'
    for (let i = 0; i < n; i++) {
      const a = rnd(17, i) * TAU
      const r0 = R * range(18, i, 0.42, 0.55)
      const r1 = R * range(19, i, 0.72, 0.97)
      x.strokeStyle = `rgba(20,14,10,${range(20, i, 0.12, 0.4)})`
      x.lineWidth = Math.max(0.35, R * 0.006)
      x.beginPath()
      x.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0)
      const midA = a + range(21, i, -0.05, 0.05)
      x.quadraticCurveTo(ix + Math.cos(midA) * (r0 + r1) * 0.5, iy + Math.sin(midA) * (r0 + r1) * 0.5, ix + Math.cos(a) * r1, iy + Math.sin(a) * r1)
      x.stroke()
    }
    x.restore()
  }

  // 瞳孔 + 眼中的倒影（这是全片最重要的一个反打镜头）
  const pr = R * 0.4
  x.save()
  x.beginPath()
  x.arc(ix, iy, pr, 0, TAU)
  x.clip()
  const pg = x.createRadialGradient(ix, iy - pr * 0.2, pr * 0.1, ix, iy, pr * 1.1)
  pg.addColorStop(0, 'rgba(14,11,9,1)')
  pg.addColorStop(0.7, 'rgba(18,14,11,1)')
  pg.addColorStop(1, 'rgba(30,22,15,1)')
  x.fillStyle = pg
  x.fillRect(ix - pr, iy - pr, pr * 2, pr * 2)

  const rf = clamp01(o.reflect ?? 0)
  if (rf > 0.001) {
    // 倒影：一支从上方垂下来的笔，笔尖朝下 —— 画这世界的那支笔
    const g = x.createLinearGradient(0, iy - pr, 0, iy + pr)
    g.addColorStop(0, `rgba(240,232,214,${0.34 * rf})`)
    g.addColorStop(0.42, `rgba(226,214,190,${0.2 * rf})`)
    g.addColorStop(1, `rgba(196,184,160,${0.1 * rf})`)
    x.fillStyle = g
    x.fillRect(ix - pr, iy - pr, pr * 2, pr * 2)
    // 远山：一道极淡的横线
    x.fillStyle = `rgba(70,54,38,${0.22 * rf})`
    x.fillRect(ix - pr, iy + pr * 0.22, pr * 2, pr * 0.05)
    x.fillStyle = `rgba(70,54,38,${0.14 * rf})`
    x.fillRect(ix - pr, iy + pr * 0.3, pr * 2, pr * 0.14)
    // 笔：上粗下细，笔尖抖
    const bw = pr * 0.34
    const sway = Math.sin(t * 1.6) * pr * 0.03
    const tipY = iy + pr * 0.16 + Math.sin(t * 2.3) * pr * 0.02
    x.beginPath()
    x.moveTo(ix - bw + sway, iy - pr * 1.05)
    x.lineTo(ix + bw + sway, iy - pr * 1.05)
    x.quadraticCurveTo(ix + bw * 0.5 + sway, iy - pr * 0.3, ix + pr * 0.03 + sway, tipY)
    x.quadraticCurveTo(ix - bw * 0.35 + sway, iy - pr * 0.3, ix - bw + sway, iy - pr * 1.05)
    x.closePath()
    x.fillStyle = `rgba(22,16,12,${0.9 * rf})`
    x.fill()
    // 笔尖上挂着的一点光
    x.fillStyle = `rgba(247,241,226,${0.55 * rf})`
    x.beginPath()
    x.arc(ix + pr * 0.03 + sway, tipY, Math.max(0.6, pr * 0.045), 0, TAU)
    x.fill()
    // 透过瞳孔的一线天光
    x.fillStyle = `rgba(247,241,226,${0.16 * rf})`
    x.beginPath()
    x.ellipse(ix - pr * 0.1, iy - pr * 1.2, pr * 0.9, pr * 0.5, 0, 0, TAU)
    x.fill()
  }
  x.restore()

  // 高光：两点，一点是窗、一点是纸的反光
  x.save()
  x.globalCompositeOperation = 'screen'
  const c1 = x.createRadialGradient(ix - R * 0.34, iy - R * 0.36, 0, ix - R * 0.34, iy - R * 0.36, R * 0.3)
  c1.addColorStop(0, `rgba(255,250,238,${0.82 * (o.glow ?? 1)})`)
  c1.addColorStop(1, 'rgba(255,250,238,0)')
  x.fillStyle = c1
  x.beginPath()
  x.arc(ix - R * 0.34, iy - R * 0.36, R * 0.3, 0, TAU)
  x.fill()
  const c2 = x.createRadialGradient(ix + R * 0.3, iy + R * 0.34, 0, ix + R * 0.3, iy + R * 0.34, R * 0.14)
  c2.addColorStop(0, `rgba(255,248,232,${0.4 * (o.glow ?? 1)})`)
  c2.addColorStop(1, 'rgba(255,248,232,0)')
  x.fillStyle = c2
  x.beginPath()
  x.arc(ix + R * 0.3, iy + R * 0.34, R * 0.14, 0, TAU)
  x.fill()
  x.restore()

  // 上睑：一笔压住整个眼神
  pen(x, [
    [cx - R * 2.62, cy + R * 0.2],
    [cx - R * 1.4, cy - R * lidOpen * 1.16],
    [cx + R * 0.4, cy - R * lidOpen * 1.14],
    [cx + R * 2.4, cy - R * 0.14],
  ], { tone: 0.9, w: Math.max(1.4, R * 0.18), head: 0.06, tail: 0.3, dry: 0.25, bristle: Math.round(clamp(R * 0.25, 2, 24)), seed: 31, tip: 0.3 })

  // 下睑：细、淡、有一点湿
  pen(x, [
    [cx - R * 2.4, cy + R * 0.22],
    [cx - R * 0.9, cy + R * lidOpen * 0.9],
    [cx + R * 1.15, cy + R * lidOpen * 0.86],
    [cx + R * 2.3, cy - R * 0.06],
  ], { tone: 0.62, alpha: 0.85, w: Math.max(0.7, R * 0.07), head: 0.2, tail: 0.3, dry: 0.4, bristle: 3, seed: 32, tip: 0.2 })

  // 眼角与褶皱
  if (detail > 0.1) {
    pen(x, [[cx - R * 2.55, cy + R * 0.18], [cx - R * 2.85, cy + R * 0.34], [cx - R * 2.6, cy + R * 0.6]], { tone: 0.6, w: Math.max(0.6, R * 0.05), alpha: 0.6, bristle: 0, seed: 33, tip: 0 })
    for (let i = 0; i < 3; i++) {
      const y0 = cy + R * (0.1 + i * 0.26)
      pen(x, [[cx + R * 2.3, y0], [cx + R * (2.7 + i * 0.16), y0 + R * (0.18 + i * 0.1)]], {
        tone: 0.5, alpha: 0.45, w: Math.max(0.5, R * 0.035), tail: 0.6, bristle: 0, seed: 34 + i, tip: 0,
      })
    }
    // 上睑褶皱
    pen(x, [[cx - R * 1.9, cy - R * (lidOpen * 1.3 + 0.16)], [cx - R * 0.4, cy - R * (lidOpen * 1.36 + 0.2)], [cx + R * 1.6, cy - R * 0.62]], {
      tone: 0.42, alpha: 0.5, w: Math.max(0.6, R * 0.05), head: 0.3, tail: 0.5, bristle: 2, seed: 35, tip: 0,
    })
  }
}

// 头：斗笠压着，脸在影子里。turn 0→1 从背到正。
export function anglerHead(x: CanvasRenderingContext2D, o: HeadOpts): void {
  const s = o.s
  const cx = o.cx
  const cy = o.cy
  const turn = clamp01(o.turn ?? 1)
  const tone = o.tone ?? 0.9
  const light = clamp01(o.light ?? 0.6)
  const t = o.t ?? 0

  const faceA = ss(0.1, 0.62, turn)
  const yaw = (1 - turn) * -0.55

  // 后脑与颈：先给一个整体的墨块，脸才不会飘
  x.save()
  x.globalCompositeOperation = 'multiply'
  const skull = new Path2D()
  skull.ellipse(cx, cy - s * 0.04, s * 0.34, s * 0.42, 0, 0, TAU)
  x.fillStyle = ink(0.55, 0.5 + 0.3 * faceA)
  x.fill(skull)
  x.restore()

  // 颈
  pen(x, [[cx - s * 0.1, cy + s * 0.34], [cx - s * 0.12, cy + s * 0.6]], { tone: tone * 0.7, w: s * 0.12, alpha: 0.8, head: 0.2, tail: 0.4, bristle: 3, seed: 41, tip: 0 })
  pen(x, [[cx + s * 0.1, cy + s * 0.34], [cx + s * 0.13, cy + s * 0.6]], { tone: tone * 0.7, w: s * 0.12, alpha: 0.8, head: 0.2, tail: 0.4, bristle: 3, seed: 42, tip: 0 })

  // 脸：只在中近景才画，远景就是一团影
  if (s > 26) {
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.globalAlpha = faceA
    const fw = s * (0.3 - 0.04 * (1 - turn))
    const face = new Path2D()
    face.moveTo(cx - fw * 0.92 + yaw * s * 0.5, cy - s * 0.3)
    face.bezierCurveTo(cx - fw * 1.05 + yaw * s * 0.3, cy + s * 0.02, cx - fw * 0.86, cy + s * 0.24, cx - fw * 0.3, cy + s * 0.34)
    face.bezierCurveTo(cx - fw * 0.1, cy + s * 0.37, cx + fw * 0.2, cy + s * 0.36, cx + fw * 0.5 + yaw * s * 0.2, cy + s * 0.3)
    face.bezierCurveTo(cx + fw * 0.95, cy + s * 0.16, cx + fw * 1.02, cy - s * 0.08, cx + fw * 0.9, cy - s * 0.28)
    face.closePath()
    const fg = x.createLinearGradient(cx - fw, cy, cx + fw, cy)
    fg.addColorStop(0, ink(0.5, 0.26))
    fg.addColorStop(0.35, ink(0.45, 0.5))
    fg.addColorStop(1, ink(0.6, 0.72))
    x.fillStyle = fg
    x.fill(face)
    x.restore()
  }

  // 斗笠：一片压下来的檐
  if (s > 18) {
    const tilt = o.hatTilt ?? 0
    pen(x, [
      [cx - s * 0.72, cy - s * 0.3],
      [cx - s * 0.34, cy - s * 0.52],
      [cx + s * 0.06, cy - s * 0.56],
      [cx + s * 0.44, cy - s * 0.48],
      [cx + s * 0.78, cy - s * 0.22 + tilt * s * 0.2],
    ], { tone, w: s * 0.09, head: 0.04, tail: 0.16, dry: 0.3, bristle: Math.round(clamp(s * 0.12, 2, 40)), seed: 51, tip: 0.25 })
    // 笠面的编织：一圈放射线
    if (s > 60) {
      for (let i = 0; i < 11; i++) {
        const q = i / 10
        const bx = lerp(cx - s * 0.68, cx + s * 0.74, q)
        const by = lerp(cy - s * 0.3 + tilt * s * 0.2, cy - s * 0.24, q)
        pen(x, [[bx, by], [lerp(bx, cx, 0.45), lerp(by, cy - s * 0.6, 0.72)]], {
          tone: tone * 0.55, alpha: 0.3, w: Math.max(0.5, s * 0.006), bristle: 0, seed: 52 + i, tip: 0,
        })
      }
    }
    // 笠影投在脸上
    x.save()
    x.globalCompositeOperation = 'multiply'
    x.globalAlpha = faceA
    const hg = x.createLinearGradient(cx, cy - s * 0.34, cx, cy + s * 0.1)
    hg.addColorStop(0, ink(0.6, 0.62))
    hg.addColorStop(1, ink(0.6, 0))
    x.fillStyle = hg
    x.fillRect(cx - s * 0.6, cy - s * 0.36, s * 1.2, s * 0.5)
    x.restore()
  }

  // 五官：只有眼睛是有戏的
  if (s > 34) {
    const ex = cx + s * 0.08 + yaw * s * 0.06
    const ey = cy + s * 0.02
    const R = s * 0.072
    x.save()
    x.globalAlpha = faceA
    // 远眼：一条线带过
    pen(x, [[ex - s * 0.27, ey + s * 0.01], [ex - s * 0.17, ey - s * 0.035], [ex - s * 0.06, ey + s * 0.005]], {
      tone: tone * 0.85, w: Math.max(1, s * 0.02), head: 0.2, tail: 0.4, bristle: 2, seed: 61, tip: 0.1,
    })
    eye(x, ex, ey, R, { open: 0.92, t, look: (o.look ?? 0) * 0.6, glow: 0.85 + light * 0.3, seed: 62 })
    // 眉
    pen(x, [[ex - s * 0.3, ey - s * 0.12], [ex - s * 0.12, ey - s * 0.17], [ex + s * 0.14, ey - s * 0.15]], {
      tone, alpha: 0.55 + light * 0.35, w: s * 0.035, head: 0.2, tail: 0.5, dry: 0.6, bristle: 4, seed: 63, tip: 0.1,
    })
    // 鼻：一笔梁，一点鼻头
    pen(x, [[ex - s * 0.02, ey - s * 0.02], [ex - s * 0.08, ey + s * 0.12], [ex + s * 0.02, ey + s * 0.17]], {
      tone: tone * 0.6, alpha: 0.35 + light * 0.2, w: Math.max(0.7, s * 0.012), head: 0.3, tail: 0.4, bristle: 2, seed: 64, tip: 0,
    })
    blob(x, ex + s * 0.015, ey + s * 0.185, s * 0.018, 0.55, 0.35, 71, 0.3)
    // 唇
    pen(x, [[ex - s * 0.09, ey + s * 0.26], [ex + s * 0.0, ey + s * 0.275], [ex + s * 0.09, ey + s * 0.255]], {
      tone: tone * 0.7, alpha: 0.4 + light * 0.2, w: Math.max(0.7, s * 0.012), head: 0.2, tail: 0.4, bristle: 2, seed: 65, tip: 0,
    })
    x.restore()
  }

  // 须：从下巴落下来，飞白越多越老
  if (s > 40) {
    const n = Math.round(clamp(s * 0.35, 6, 40))
    for (let i = 0; i < n; i++) {
      const q = i / n
      const bx = cx - s * 0.22 + q * s * 0.44
      const by = cy + s * 0.32 + Math.sin(q * 3.1) * s * 0.02
      const len = s * range(81, i, 0.16, 0.4)
      pen(x, [[bx, by], [bx + s * 0.02 * (q - 0.5) + Math.sin(t * 0.7 + i) * s * 0.004, by + len * 0.55], [bx + s * 0.05 * (q - 0.5), by + len]], {
        tone: tone * range(82, i, 0.7, 1), alpha: range(83, i, 0.3, 0.7) * faceA, w: Math.max(0.6, s * 0.008), head: 0.4, tail: 0.85, dry: 0.7, bristle: 0, seed: 84 + i, tip: 0,
      })
    }
  }
}

// 肩背：静立时的轮廓，中景用
export function anglerBody(x: CanvasRenderingContext2D, cx: number, cy: number, s: number, o: { tone?: number; turn?: number; t?: number } = {}): void {
  const tone = o.tone ?? 0.85
  const turn = clamp01(o.turn ?? 1)
  const s2 = s
  // 袍
  const robe = new Path2D()
  robe.moveTo(cx - s2 * 0.26, cy)
  robe.bezierCurveTo(cx - s2 * 0.5, cy + s2 * 0.44, cx - s2 * 0.62, cy + s2 * 0.9, cx - s2 * 0.66, cy + s2 * 1.5)
  robe.lineTo(cx + s2 * 0.66, cy + s2 * 1.5)
  robe.bezierCurveTo(cx + s2 * 0.62, cy + s2 * 0.9, cx + s2 * 0.5, cy + s2 * 0.44, cx + s2 * 0.26, cy)
  robe.closePath()
  x.save()
  x.globalCompositeOperation = 'multiply'
  const rg = x.createLinearGradient(cx - s2 * 0.6, 0, cx + s2 * 0.6, 0)
  rg.addColorStop(0, ink(tone * 0.5, 0.72))
  rg.addColorStop(0.4, ink(tone * 0.42, 0.6))
  rg.addColorStop(1, ink(tone * 0.55, 0.44))
  x.fillStyle = rg
  x.fill(robe)
  x.restore()
  // 衣纹
  pen(x, [[cx - s2 * 0.3, cy + s2 * 0.36], [cx - s2 * 0.44, cy + s2 * 0.86], [cx - s2 * 0.5, cy + s2 * 1.36]], { tone: tone * 0.6, alpha: 0.35, w: Math.max(1, s2 * 0.02), dry: 0.5, bristle: 2, seed: 91, tip: 0 })
  pen(x, [[cx + s2 * 0.16, cy + s2 * 0.4], [cx + s2 * 0.3, cy + s2 * 0.94], [cx + s2 * 0.38, cy + s2 * 1.4]], { tone: tone * 0.6, alpha: 0.3, w: Math.max(1, s2 * 0.02), dry: 0.55, bristle: 2, seed: 92, tip: 0 })
  // 肩线
  pen(x, [[cx - s2 * 0.34, cy + s2 * 0.02], [cx - s2 * 0.12, cy - s2 * 0.05], [cx + s2 * 0.14, cy - s2 * 0.04], [cx + s2 * 0.34, cy + s2 * 0.04]], {
    tone, alpha: 0.6, w: Math.max(1.2, s2 * 0.03), head: 0.1, tail: 0.4, dry: 0.45, bristle: 3, seed: 93, tip: 0,
  })
  if (turn > 0.4) {
    // 衣领
    pen(x, [[cx - s2 * 0.1, cy - s2 * 0.02], [cx - s2 * 0.02, cy + s2 * 0.16], [cx + s2 * 0.1, cy + s2 * 0.02]], { tone: tone * 0.8, alpha: 0.55, w: Math.max(1, s2 * 0.02), dry: 0.4, bristle: 2, seed: 94, tip: 0 })
  }
}
