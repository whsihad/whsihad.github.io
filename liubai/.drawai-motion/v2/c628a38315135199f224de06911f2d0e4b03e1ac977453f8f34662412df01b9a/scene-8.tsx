import React from 'react'
import { InkStage } from './ink/stage'
import { getPaper, drawGrain } from './ink/paper'
import { W, H, ss, clamp01, ink, easeInOut, n1, scratch, paperC } from './ink/core'
import { mountain, mist } from './ink/terrain'
import { SERIF, MONO } from './theme'

// 第九镜：空心字。
// 整幅被墨填满，只有「留」是空的——留白不是没有，是被挖出来的那一块。
const DUR = 288

const draw = (x: CanvasRenderingContext2D, f: number): void => {
  const t = f / DUR
  x.drawImage(getPaper(), 0, 0)

  // 墨：先铺满，再挖字。字是挖出来的，不是画出来的。
  const [c, cx] = scratch('s8ink', W, H)
  cx.clearRect(0, 0, W, H)
  const base = cx.createLinearGradient(0, 0, 0, H)
  base.addColorStop(0, 'rgba(32,28,23,0.97)')
  base.addColorStop(0.5, 'rgba(22,19,16,0.98)')
  base.addColorStop(1, 'rgba(30,26,21,0.97)')
  cx.fillStyle = base
  cx.fillRect(0, 0, W, H)

  // 墨里还有山：近处压黑，远处更黑
  cx.save()
  cx.globalCompositeOperation = 'source-over'
  mountain(cx, { base: H * 1.02, amp: H * 0.34, seed: 601, freq: 1.9, oct: 5, tone: 0.96, alpha: 0.5, key: 's8a', cun: 0.9, cunTone: 0.7 })
  mountain(cx, { base: H * 0.52, amp: H * 0.36, seed: 611, freq: 1.3, oct: 4, tone: 0.9, alpha: 0.34, key: 's8b', cun: 0.5, cunTone: 0.5 })
  cx.restore()

  // 挖字：从上往下一笔一笔露出来
  const wipe = ss(0.1, 0.62, t)
  cx.save()
  cx.beginPath()
  cx.rect(0, 0, W, H * (0.04 + wipe * 0.98))
  cx.clip()
  cx.globalCompositeOperation = 'destination-out'
  cx.fillStyle = '#000'
  cx.textAlign = 'center'
  cx.textBaseline = 'middle'
  cx.font = `760px ${SERIF}`
  cx.fillText('留', W * 0.5, H * 0.5)
  cx.restore()

  // 字的边缘：墨被水推出来的一圈湿边
  cx.save()
  cx.globalCompositeOperation = 'source-over'
  cx.globalAlpha = 0.5 * wipe
  cx.strokeStyle = 'rgba(239,230,208,0.5)'
  cx.lineWidth = 3
  cx.filter = 'blur(6px)'
  cx.textAlign = 'center'
  cx.textBaseline = 'middle'
  cx.font = `760px ${SERIF}`
  cx.strokeText('留', W * 0.5, H * 0.5)
  cx.filter = 'none'
  cx.restore()

  x.drawImage(c, 0, 0)

  // 底下一行小字：纸色，压在墨上
  const cap = ss(0.55, 0.82, t)
  if (cap > 0) {
    x.save()
    x.globalAlpha = cap
    x.fillStyle = paperC(0.92)
    x.font = `30px ${SERIF}`
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.letterSpacing = '6px'
    x.fillText('留白，是最满的一个字。', W * 0.5, H * 0.9)
    x.restore()
  }

  drawGrain(x, f, 0.04, 29)
}

export default function Scene(_: { anchors?: Record<string, number> }) {
  return <InkStage draw={draw} />
}
