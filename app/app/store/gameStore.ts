import { create } from 'zustand';

export interface GameState {
  // Existing Neon Arena user + game state (keep whatever you already had)
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;

  // Example game state (adjust to your actual fields)
  score: number;
  setScore: (s: number) => void;

  // Flare wallet
  flareConnected: boolean;
  flareAddress: string | null;
  setFlareConnected: (v: boolean) => void;
  setFlareAddress: (addr: string | null) => void;

  // RippleLens A – trading / lending (you can extend later)
  ripplensPositions: {
    id: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
    openedAt: number;
  }[];
  ripplensRealizedPnlUser: number;
  ripplensRealizedPnlLenders: number;
  ripplensRealizedPnlProtocol: number;
  ripplensLends: { id: string; amount: number; createdAt: number }[];
  ripplensBorrows: { id: string; amount: number; createdAt: number }[];

  addRipplensPosition: (p: {
    id: string;
    side: 'long' | 'short';
    size: number;
    entryPrice: number;
  }) => void;
  closeRipplensPosition: (id: string, closePrice: number) => void;
  addRipplensLend: (amount: number) => void;
  addRipplensBorrow: (amount: number) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // =========================
  // Basic user / game state
  // =========================
  userEmail: null,
  setUserEmail: (email) => set({ userEmail: email }),

  score: 0,
  setScore: (s) => set({ score: s }),

  // =========================
  // Flare wallet
  // =========================
  flareConnected: false,
  flareAddress: null,
  setFlareConnected: (v) => set({ flareConnected: v }),
  setFlareAddress: (addr) => set({ flareAddress: addr }),

  // =========================
  // RippleLens A trading / lending
  // =========================
  ripplensPositions: [],
  ripplensRealizedPnlUser: 0,
  ripplensRealizedPnlLenders: 0,
  ripplensRealizedPnlProtocol: 0,
  ripplensLends: [],
  ripplensBorrows: [],

  addRipplensPosition: ({ id, side, size, entryPrice }) =>
    set((state) => ({
      ripplensPositions: [
        ...state.ripplensPositions,
        { id, side, size, entryPrice, openedAt: Date.now() },
      ],
    })),

  closeRipplensPosition: (id, closePrice) =>
    set((state) => {
      const pos = state.ripplensPositions.find((p) => p.id === id);
      if (!pos) return state;

      const isLong = pos.side === 'long';
      const diff = isLong
        ? closePrice - pos.entryPrice
        : pos.entryPrice - closePrice;
      const pnl = diff * pos.size;

      let user = state.ripplensRealizedPnlUser;
      let lenders = state.ripplensRealizedPnlLenders;
      let protocol = state.ripplensRealizedPnlProtocol;

      if (pnl > 0) {
        const u = pnl * 0.8;
        const l = pnl * 0.15;
        const t = pnl * 0.05;
        user += u;
        lenders += l;
        protocol += t;
      } else {
        user += pnl;
      }

      return {
        ripplensPositions: state.ripplensPositions.filter(
          (p) => p.id !== id
        ),
        ripplensRealizedPnlUser: user,
        ripplensRealizedPnlLenders: lenders,
        ripplensRealizedPnlProtocol: protocol,
      };
    }),

  addRipplensLend: (amount) =>
    set((state) => ({
      ripplensLends: [
        ...state.ripplensLends,
        { id: crypto.randomUUID(), amount, createdAt: Date.now() },
      ],
    })),

  addRipplensBorrow: (amount) =>
    set((state) => ({
      ripplensBorrows: [
        ...state.ripplensBorrows,
        { id: crypto.randomUUID(), amount, createdAt: Date.now() },
      ],
    })),
}));
