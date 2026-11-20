// 画布舞台：一帧一画，幂等。所有场景都走这里。
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion'
import { W, H } from './core'

let fontHandle: number | null = null

export function useInkFonts(): boolean {
  const [handle] = useState(() => {
    if (fontHandle === null) fontHandle = delayRender('水墨字体')
    return fontHandle
  })
  const [, setOk] = useState(false)
  useEffect(() => {
    const done = (): void => {
      setOk(true)
      continueRender(handle)
    }
    Promise.all([
      document.fonts.load('400 64px "Long Cang"'),
      document.fonts.load('400 64px "Noto Serif SC"'),
      document.fonts.load('700 64px "Noto Serif SC"'),
      document.fonts.load('400 24px "IBM Plex Mono"'),
    ])
      .then(() => document.fonts.ready)
      .then(done)
      .catch(done)
  }, [handle])
  return true
}

export type DrawFn = (x: CanvasRenderingContext2D, frame: number, dur: number) => void

export const InkStage: React.FC<{ draw: DrawFn; scale?: number }> = ({ draw, scale = 1 }) => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const ref = useRef<HTMLCanvasElement>(null)
  useInkFonts()

  useLayoutEffect(() => {
    const c = ref.current
    if (!c) return
    const x = c.getContext('2d')
    if (!x) return
    x.setTransform(1, 0, 0, 1, 0, 0)
    x.globalAlpha = 1
    x.globalCompositeOperation = 'source-over'
    x.filter = 'none'
    x.clearRect(0, 0, c.width, c.height)
    x.save()
    x.scale(scale, scale)
    draw(x, frame, durationInFrames)
    x.restore()
  }, [frame, durationInFrames, draw, scale])

  return (
    <AbsoluteFill style={{ backgroundColor: '#EFE6D0' }}>
      <canvas ref={ref} width={W * scale} height={H * scale} style={{ width: '100%', height: '100%', display: 'block' }} />
    </AbsoluteFill>
  )
}

// ── 相机 ──────────────────────────────────────────────────────────────
export type Cam = { x: number; y: number; zoom: number; rot?: number }

export function applyCam(x: CanvasRenderingContext2D, cam: Cam): void {
  x.translate(W / 2, H / 2)
  if (cam.rot) x.rotate(cam.rot)
  x.scale(cam.zoom, cam.zoom)
  x.translate(-cam.x, -cam.y)
}

export function camLayer(x: CanvasRenderingContext2D, cam: Cam, fn: () => void): void {
  x.save()
  applyCam(x, cam)
  fn()
  x.restore()
}

// 视差：远景走得慢，近景走得快
export function parallax(cam: Cam, depth: number): Cam {
  return {
    x: W / 2 + (cam.x - W / 2) * depth,
    y: H / 2 + (cam.y - H / 2) * depth,
    zoom: 1 + (cam.zoom - 1) * depth,
    rot: (cam.rot ?? 0) * depth,
  }
}

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  zoom: a.zoom + (b.zoom - a.zoom) * t,
  rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * t,
})
