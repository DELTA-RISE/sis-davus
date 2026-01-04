import { create } from 'zustand'

interface ScrollState {
    scrollProgress: number
    setScrollProgress: (progress: number) => void
}

export const useScrollStore = create<ScrollState>((set) => ({
    scrollProgress: 0,
    setScrollProgress: (progress) => set({ scrollProgress: progress }),
}))
