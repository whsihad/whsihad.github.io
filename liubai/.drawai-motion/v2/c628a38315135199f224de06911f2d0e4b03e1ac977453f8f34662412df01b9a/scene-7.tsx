import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, TAU, ss, clamp01, lerp, ink, range, easeInOut, easeOut, n1 } from './ink/core'
import { pen, inkText, seal, hairline } from './ink/brush'
import { mountain, mist } from './ink/terrain'
import { MONO, SERIF } from './theme'

// 第八镜：退出画卷。
// 镜头往后退，观众才发现自己一直在纸里。题名落下，印压上。
const DUR = 288

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  // 案上的纸比画里的纸暗一档：这样「一张纸」才立得起来
  const pull = easeInOut(ss(0.0, 0.5, t))
  const sheetW = lerp(W * 1.32, W * 0.525, pull)
  const sheetH = sheetW * 0.5625
  const sx = W * 0.5 - sheetW / 2
  const sy = lerp(-H * 0.16, H * 0.075, pull)

  // 桌面：一圈更深的纸色
  x.save()
  x.globalCompositeOperation = 'multiply'
  const desk = x.createRadialGradient(W * 0.5, H * 0.44, H * 0.2, W * 0.5, H * 0.44, W * 0.82)
  desk.addColorStop(0, 'rgba(255,255,255,0)')
  desk.addColorStop(0.55, 'rgba(196,176,142,0.16)')
  desk.addColorStop(1, 'rgba(138,120,92,0.5)')
  x.fillStyle = desk
  x.fillRect(0, 0, W, H)
  x.restore()

  // 纸的厚度：一道柔影
  x.save()
  x.filter = 'blur(18px)'
  x.fillStyle = 'rgba(70,58,42,0.24)'
  x.fillRect(sx + 8, sy + 14, sheetW, sheetH)
  x.filter = 'none'
  x.restore()

  // 画：把整幅山水缩进这张纸
  x.save()
  x.beginPath()
  x.rect(sx, sy, sheetW, sheetH)
  x.clip()
  x.fillStyle = '#EFE6D0'
  x.fillRect(sx, sy, sheetW, sheetH)
  x.translate(sx, sy)
  x.scale(sheetW / W, sheetH / H)
  // 缩进去之后，山还是那几座山
  mountain(x, { base: H * 0.74, amp: H * 0.3, seed: 501, freq: 1.6, oct: 5, tone: 0.32, alpha: 0.5, key: 's7far', blur: 4, cun: 0.2 })
  mountain(x, { base: H * 0.88, amp: H * 0.28, seed: 511, freq: 2.1, oct: 5, tone: 0.68, alpha: 0.8, key: 's7mid', cun: 0.8 })
  // 水与留白：下半张只给一条水线
  pen(x, [[-20, H * 0.86], [W * 0.5, H * 0.845], [W + 20, H * 0.87]], { tone: 0.4, alpha: 0.3, w: 12, head: 0.3, tail: 0.3, dry: 0.7, bristle: 5, seed: 521, tip: 0.2 })
  mist(x, H * 0.72, H * 0.16, 0.34, 531, t * 0.4)
  // 一枚小印在右下角
  seal(x, W * 0.9, H * 0.82, 64, ['留', '白'], { reveal: ss(0.4, 0.62, t), seed: 541, rot: 0.01 })
  x.restore()

  // 纸边：一条极细的线，不是框
  x.save()
  x.globalCompositeOperation = 'multiply'
  x.strokeStyle = ink(0.4, 0.22)
  x.lineWidth = 1.2
  x.strokeRect(sx, sy, sheetW, sheetH)
  x.restore()

  // 题名
  const tt = ss(0.42, 0.8, t)
  const ty = H * 0.755
  if (tt > 0) {
    inkText(x, '留白', W * 0.5 - 104, ty, {
      size: 158, font: SERIF, tone: 0.93, spacing: 22, align: 'center', reveal: tt, seed: 551,
    })
    inkText(x, 'T H E   B L A N K', W * 0.5 - 104, ty + 96, {
      size: 21, font: MONO, tone: 0.5, spacing: 3, align: 'center', reveal: clamp01((tt - 0.45) / 0.5), seed: 553,
    })
    hairline(x, W * 0.5 - 104 - 130, ty - 124, W * 0.5 - 104 + 130, ty - 124, clamp01((tt - 0.2) / 0.6), 561, 0.3)
    // 大印：压住画面
    seal(x, W * 0.5 + 190, ty - 40, 96, ['留', '白'], { reveal: clamp01((tt - 0.7) / 0.3), seed: 563, rot: -0.015 })
  }

  // 右下一列小字：题跋
  const ta = ss(0.62, 0.92, t)
  if (ta > 0) {
    inkText(x, '一纸之上，万物来过', W * 0.865, H * 0.16, {
      size: 26, font: SERIF, tone: 0.5, vertical: true, spacing: 8, align: 'center', reveal: ta, seed: 571,
    })
  }

  drawGrain(x, f, 0.045, 23)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
