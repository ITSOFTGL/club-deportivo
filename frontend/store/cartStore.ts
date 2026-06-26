import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/api/products';

export interface CartLine {
  productId: string;
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  customName?: string;
  customNumber?: string;
}

interface CartState {
  items: CartLine[];
  addItem: (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void;
  updateQty: (productId: string, size: string | undefined, delta: number) => void;
  removeItem: (productId: string, size?: string) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

function lineKey(productId: string, size?: string) {
  return `${productId}:${size ?? ''}`;
}

function unitPrice(line: CartLine): number {
  const base = line.product.discountPrice ?? line.product.price;
  const extra =
    line.product.requiresCustomization &&
    (line.customName || line.customNumber)
      ? line.product.customizationPrice ?? 0
      : 0;
  return base + extra;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (line) => {
        const qty = line.quantity ?? 1;
        set((state) => {
          const idx = state.items.findIndex(
            (i) =>
              i.productId === line.productId &&
              i.size === line.size &&
              i.color === line.color,
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
            return { items: next };
          }
          return {
            items: [
              ...state.items,
              { ...line, quantity: qty },
            ],
          };
        });
      },

      updateQty: (productId, size, delta) => {
        set((state) =>
          ({
            items: state.items
              .map((i) =>
                lineKey(i.productId, i.size) === lineKey(productId, size)
                  ? { ...i, quantity: i.quantity + delta }
                  : i,
              )
              .filter((i) => i.quantity > 0),
          }),
        );
      },

      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => lineKey(i.productId, i.size) !== lineKey(productId, size),
          ),
        }));
      },

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0),

      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'club-shop-cart' },
  ),
);

export { unitPrice };
