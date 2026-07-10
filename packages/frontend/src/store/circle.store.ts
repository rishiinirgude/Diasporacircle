import { create } from 'zustand';
import { Circle } from '../types';

interface CircleState {
  circles: Circle[];
  setCircles: (circles: Circle[]) => void;
  addCircle: (circle: Circle) => void;
}

export const useCircleStore = create<CircleState>((set) => ({
  circles: [],
  setCircles: (circles) => set({ circles }),
  addCircle: (circle) => set((state) => ({ circles: [...state.circles, circle] })),
}));
