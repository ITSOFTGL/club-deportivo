// app/dashboard/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  CubeIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useProductsStore } from '@/store/productsStore';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useBranchesStore } from '@/store/branchesStore';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CreateProductDto } from '@/lib/api/products';

const productTypeLabels: Record<string, string> = {
  UNIFORM: 'Uniforme',
  ACCESSORY: 'Accesorio',
  EQUIPMENT: 'Equipo',
  OTHER: 'Otro',
};

const productTypeColors: Record<string, string> = {
  UNIFORM: 'bg-purple-100 text-purple-800',
  ACCESSORY: 'bg-blue-100 text-blue-800',
  EQUIPMENT: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export default function ProductsPage() {
  const { products, loading, searchTerm, setSearchTerm, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { branches, fetchBranches } = useBranchesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBranches();
  }, []);

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.productType?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Productos', value: products.length, icon: ShoppingBagIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activos', value: products.filter(p => p.isActive).length, icon: ShoppingBagIcon, color: 'from-green-500 to-green-600' },
    { label: 'Stock Bajo', value: products.filter(p => p.stock <= p.minStock).length, icon: CubeIcon, color: 'from-yellow-500 to-yellow-600' },
  ];

  const handleSubmit = async (data: CreateProductDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingProduct) {
      success = await updateProduct(editingProduct.id, data);
    } else {
      success = await createProduct(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingProduct(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setFormLoading(true);
    const success = await deleteProduct(deletingProduct.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingProduct(null);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tienda</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona uniformes, accesorios y equipamiento</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-10 h-10 text-white/30" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <ShoppingBagIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <ShoppingBagIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 font-mono">{product.sku}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${productTypeColors[product.productType]}`}>
                          {productTypeLabels[product.productType]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {product.discountPrice ? (
                            <>
                              <p className="text-sm text-gray-400 line-through">Bs. {product.price.toLocaleString()}</p>
                              <p className="text-sm font-semibold text-green-600">Bs. {product.discountPrice.toLocaleString()}</p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold">Bs. {product.price.toLocaleString()}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-600'}`}>
                          {product.stock} unidades
                        </span>
                        {product.stock <= product.minStock && (
                          <p className="text-xs text-red-500">Stock bajo</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingProduct(product);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        branches={branches}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de eliminar el producto "${deletingProduct?.name}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}