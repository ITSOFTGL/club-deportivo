'use client';

import { useMemo, useState } from 'react';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Product } from '@/lib/api/products';
import { useCartStore } from '@/store/cartStore';
import { resolveMediaUrl } from '@/lib/utils/mediaUrl';
import { ProductDetailModal } from './ProductDetailModal';
import { CheckoutModal } from './CheckoutModal';

const TYPE_LABELS: Record<string, string> = {
  UNIFORM: 'Uniforme',
  SOCKS: 'Medias',
  SHINGUARD: 'Canilleras',
  BALL: 'Balones',
  BAG: 'Mochilas',
  ACCESSORY: 'Accesorio',
  EQUIPMENT: 'Equipo',
  OTHER: 'Otro',
};

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'popular';

interface ShopCatalogProps {
  products: Product[];
  loading: boolean;
}

export function ShopCatalog({ products, loading }: ShopCatalogProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sort, setSort] = useState<SortKey>('popular');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cartCount = useCartStore((s) => s.count());

  const types = useMemo(
    () => [...new Set(products.map((p) => p.productType))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.isActive);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (typeFilter.length) {
      list = list.filter((p) => typeFilter.includes(p.productType));
    }
    list = [...list].sort((a, b) => {
      if (sort === 'popular') {
        if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
        return a.name.localeCompare(b.name);
      }
      if (sort === 'price-asc') {
        return (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price);
      }
      if (sort === 'price-desc') {
        return (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [products, search, typeFilter, inStockOnly, sort]);

  const toggleType = (t: string) => {
    setTypeFilter((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <FunnelIcon className="w-4 h-4" /> Filtros
            </h3>
            <label className="flex items-center gap-2 text-sm mb-3">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              Solo con stock
            </label>
            <p className="text-xs font-medium text-gray-500 mb-2">Categoría</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {types.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(t)}
                    onChange={() => toggleType(t)}
                  />
                  {TYPE_LABELS[t] ?? t}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="popular">Popular / destacados</option>
              <option value="name">Nombre A-Z</option>
              <option value="price-asc">Precio menor</option>
              <option value="price-desc">Precio mayor</option>
            </select>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#7c0613] text-white rounded-lg text-sm font-medium"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              Carrito ({cartCount})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((product) => {
              const img = resolveMediaUrl(product.mainImage);
              const price = product.discountPrice ?? product.price;
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setDetailProduct(product)}
                  className="bg-white rounded-xl shadow-sm border text-left overflow-hidden hover:shadow-md transition-shadow"
                >
                  {img ? (
                    <img src={img} alt={product.name} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      Sin imagen
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex gap-2 mb-1">
                      {product.isPopular && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Popular
                        </span>
                      )}
                      {product.stock <= product.minStock && product.stock > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                          Pocas unidades
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{TYPE_LABELS[product.productType] ?? product.productType}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      {product.discountPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          Bs. {product.price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-lg font-bold text-[#7c0613]">
                        Bs. {price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-12">No hay productos con esos filtros</p>
          )}
        </div>
      </div>

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onGoCheckout={() => {
          setDetailProduct(null);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
