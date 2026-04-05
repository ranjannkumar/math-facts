import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

const EMPTY_CTX = {};

export const useMathGameBridgeStore = create(() => ({
  ctx: EMPTY_CTX,
}));

export const syncMathGameBridgeStore = (ctx) => {
  useMathGameBridgeStore.setState({ ctx: ctx || EMPTY_CTX });
};

export const useMathGameSelector = (selector) =>
  useMathGameBridgeStore((state) => selector(state.ctx || EMPTY_CTX));

export const useMathGamePick = (selector) =>
  useMathGameBridgeStore(useShallow((state) => selector(state.ctx || EMPTY_CTX)));
