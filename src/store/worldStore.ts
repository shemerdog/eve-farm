import { create } from 'zustand'
import type { CameraState, WorldMapState } from '@/types'

type Actions = {
  setCamera: (camera: CameraState) => void
}

// Camera is not persisted — WorldMap.tsx re-centres on the farm tile each session.
export const useWorldStore = create<WorldMapState & Actions>()((set) => ({
  camera: { x: 0, y: 0 },
  setCamera: (camera) => set({ camera }),
}))
