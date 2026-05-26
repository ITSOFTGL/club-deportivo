'use client';

import { useMemo, useState } from 'react';
import { ShoppingCartIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Product } from '@/lib/api/products';
import toast from 'react-hot-toast';

interface CartItem {
  product: Product;
  qty: number;
}

interface ParentShopViewProps {
  products: Product[];
  loading: boolean;
}

export function ParentShopView({ products, loading }: ParentShopViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive && p.stock > 0),
    [products],
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error('No hay más stock disponible');
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    toast.success('Agregado al carrito');
  };

  const total = cart.reduce(
    (sum, i) =>
      sum + (i.product.discountPrice ?? i.product.price) * i.qty,
    0,
  );

  const requestOrder = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    toast.success(
      'Solicitud registrada. Un cobrador confirmará stock y método de pago.',
    );
    setCart([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {activeProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden border"
          >
            {product.mainImage ? (
              <img
                src={product.mainImage}
                alt={product.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Sin imagen
              </div>
            )}
            <div className="p-4">
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-lg font-bold text-[#7c0613] mt-1">
                Bs.{' '}
                {(product.discountPrice ?? product.price).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Stock: {product.stock}
              </p>
              <button
                type="button"
                onClick={() => addToCart(product)}
                className="mt-3 w-full py-2 bg-[#7c0613] text-white rounded-lg text-sm font-medium hover:opacity-90"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 h-fit sticky top-4">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <ShoppingCartIcon className="w-5 h-5" />
          Mi carrito
        </h2>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500">No hay productos en el carrito</p>
        ) : (
          <ul className="space-y-3 mb-4">
            {cart.map((item) => (
              <li
                key={item.product.id}
                className="flex justify-between items-center text-sm border-b pb-2"
              >
                <span>
                  {item.product.name} x{item.qty}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setCart((prev) =>
                        prev
                          .map((i) =>
                            i.product.id === item.product.id
                              ? { ...i, qty: i.qty - 1 }
                              : i,
                          )
                          .filter((i) => i.qty > 0),
                      )
                    }
                    className="p-1 rounded bg-gray-100"
                  >
                    <MinusIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addToCart(item.product)}
                    className="p-1 rounded bg-gray-100"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="font-bold text-lg mb-4">Total: Bs. {total.toLocaleString()}</p>
        <button
          type="button"
          onClick={requestOrder}
          disabled={cart.length === 0}
          className="w-full py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg disabled:opacity-50"
        >
          Solicitar reserva / pago
        </button>
      </div>
    </div>
  );
}
