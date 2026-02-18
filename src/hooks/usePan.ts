import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { clampCamera, applyMomentumFrame } from '@/game/worldMap'

// Minimum pointer movement (px) before a press is treated as a drag.
// Below this threshold the press is a tap and click events reach inner elements.
const DRAG_THRESHOLD_PX = 5

// usePan attaches pointer event listeners to the given element and drives the
// world camera via the worldStore. Momentum is tracked in refs to avoid
// triggering React re-renders on every pointer-move event.
export const usePan = (viewportRef: RefObject<HTMLDivElement | null>) => {
  const setCamera = useWorldStore((s) => s.setCamera)

  // Ephemeral drag state: lives in refs, never causes re-renders
  // pointerDown — a pointer is currently pressed
  // dragActive  — movement exceeded threshold; real panning + capture engaged
  const pointerDown = useRef(false)
  const dragActive = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0 })
  const vel = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    let rafId: number | null = null

    const stopMomentum = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      stopMomentum()
      pointerDown.current = true
      dragActive.current = false
      startPos.current = { x: e.clientX, y: e.clientY }
      lastPos.current = { x: e.clientX, y: e.clientY }
      vel.current = { x: 0, y: 0 }
      // setPointerCapture is intentionally deferred to onPointerMove once the
      // drag threshold is exceeded, so that simple taps still deliver click
      // events to inner elements (farm plot tiles, Buy Land buttons).
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!pointerDown.current) return

      if (!dragActive.current) {
        const dx = e.clientX - startPos.current.x
        const dy = e.clientY - startPos.current.y
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX ** 2) return
        // Threshold exceeded — commit to drag and capture future events
        dragActive.current = true
        el.setPointerCapture(e.pointerId)
        lastPos.current = { x: e.clientX, y: e.clientY }
        return
      }

      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      vel.current = { x: dx, y: dy }
      // Read current camera fresh from store to avoid stale closure
      const camera = useWorldStore.getState().camera
      setCamera(clampCamera({ x: camera.x + dx, y: camera.y + dy }, el.clientWidth, el.clientHeight))
    }

    const onPointerUp = () => {
      pointerDown.current = false
      const wasDragging = dragActive.current
      dragActive.current = false
      if (!wasDragging) return  // was a tap — let click propagate normally
      // Snapshot viewport dimensions for the duration of the momentum loop
      const vpW = el.clientWidth
      const vpH = el.clientHeight

      const step = () => {
        const camera = useWorldStore.getState().camera
        const result = applyMomentumFrame(camera, vel.current.x, vel.current.y, vpW, vpH)
        vel.current = { x: result.velX, y: result.velY }
        setCamera(result.camera)
        rafId = result.done ? null : requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
    }

    const onPointerCancel = () => {
      pointerDown.current = false
      dragActive.current = false
      stopMomentum()
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return () => {
      stopMomentum()
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [setCamera]) // setCamera is stable (Zustand guarantee); viewportRef object is stable (React guarantee)
}
