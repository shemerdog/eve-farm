import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useWorldStore } from '@/store/worldStore'
import { clampCamera, applyMomentumFrame } from '@/game/worldMap'

// usePan attaches pointer event listeners to the given element and drives the
// world camera via the worldStore. Momentum is tracked in refs to avoid
// triggering React re-renders on every pointer-move event.
export const usePan = (viewportRef: RefObject<HTMLDivElement | null>) => {
  const setCamera = useWorldStore((s) => s.setCamera)

  // Ephemeral drag state: lives in refs, never causes re-renders
  const dragging = useRef(false)
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
      dragging.current = true
      lastPos.current = { x: e.clientX, y: e.clientY }
      vel.current = { x: 0, y: 0 }
      // Capture ensures pointermove fires even when the pointer leaves the element
      el.setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      vel.current = { x: dx, y: dy }
      // Read current camera fresh from store to avoid stale closure
      const camera = useWorldStore.getState().camera
      setCamera(clampCamera({ x: camera.x + dx, y: camera.y + dy }, el.clientWidth, el.clientHeight))
    }

    const onPointerUp = () => {
      if (!dragging.current) return
      dragging.current = false
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
      dragging.current = false
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
