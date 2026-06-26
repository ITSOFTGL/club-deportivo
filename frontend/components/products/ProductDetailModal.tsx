'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Product } from '@/lib/api/products';
import { useCartStore } from '@/store/cartStore';
import { resolveMediaUrl } from '@/lib/utils/mediaUrl';

interface Props {
  product: Product | null;
  onClose: () => void;
  onGoCheckout: () => void;
}

export function ProductDetailModal({ product, onClose, onGoCheckout }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  if (!product) return null;

  const sizes = (product.sizes as string[] | undefined) ?? [];
  const colors = (product.colors as string[] | undefined) ?? [];
  const img = resolveMediaUrl(product.mainImage);
  const base = product.discountPrice ?? product.price;
  const customExtra =
    product.requiresCustomization && (customName || customNumber)
      ? product.customizationPrice ?? 0
      : 0;
  const lineTotal = (base + customExtra) * qty;

  const handleAdd = () => {
    if (sizes.length && !size) {
      toast.error('Seleccione una talla');
      return;
    }
    if (product.requiresCustomization && (!customName.trim() || !customNumber.trim())) {
      toast.error('Ingrese nombre y número para personalizar');
      return;
    }
    if (qty > product.stock) {
      toast.error('Stock insuficiente');
      return;
    }
    const customization =
      product.requiresCustomization && customName
        ? `Nombre: ${customName.trim()}, Número: ${customNumber.trim()}`
        : undefined;

    addItem({
      productId: product.id,
      product,
      quantity: qty,
      size: size || undefined,
      color: color || undefined,
      customName: customName.trim() || undefined,
      customNumber: customNumber.trim() || undefined,
    });
    toast.success('Agregado al carrito');
    onClose();
  };

  return (
    <Dialog open={Boolean(product)} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-8">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-lg font-semibold pr-4">{product.name}</Dialog.Title>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {img && (
            <img src={img} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
          )}
          {product.description && (
            <p className="text-sm text-gray-600 mb-4">{product.description}</p>
          )}

          <p className="text-2xl font-bold text-[#7c0613] mb-4">
            Bs. {base.toLocaleString()}
            {product.discountPrice && (
              <span className="text-sm text-gray-400 line-through ml-2 font-normal">
                Bs. {product.price.toLocaleString()}
              </span>
            )}
          </p>

          {sizes.length > 0 && (
            <div className="mb-3">
              <label className="text-sm font-medium">Talla</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-3 py-1 rounded-lg border text-sm ${
                      size === s ? 'border-[#7c0613] bg-[#7c0613]/10' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="mb-3">
              <label className="text-sm font-medium">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Seleccionar</option>
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {product.requiresCustomization && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Personalización (+ Bs. {(product.customizationPrice ?? 0).toLocaleString()})</p>
              <input
                type="text"
                placeholder="Nombre del alumno"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                max={99}
                placeholder="Número (1-99)"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {(customName || customNumber) && (
                <div className="mt-2 p-4 bg-white border rounded-lg text-center">
                  <div className="mx-auto w-32 h-40 bg-gradient-to-b from-[#7c0613] to-[#4a030b] rounded-lg flex flex-col items-center justify-center text-white shadow-inner">
                    <span className="text-xs opacity-80">Vista previa</span>
                    <span className="text-lg font-bold mt-2">{customNumber || '10'}</span>
                    <span className="text-sm mt-1 uppercase tracking-wide">{customName || 'Nombre'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium">Cantidad</label>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="w-20 border rounded-lg px-2 py-1 text-sm"
            />
            <span className="text-xs text-gray-500">Stock: {product.stock}</span>
          </div>

          <p className="text-sm font-semibold mb-4">Subtotal: Bs. {lineTotal.toLocaleString()}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2 bg-[#7c0613] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Añadir al carrito
            </button>
            <button
              type="button"
              onClick={() => {
                handleAdd();
                onGoCheckout();
              }}
              className="flex-1 py-2 border border-[#7c0613] text-[#7c0613] rounded-lg text-sm font-medium"
            >
              Comprar ahora
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
