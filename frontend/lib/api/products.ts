// lib/api/products.ts
import api from '../axios';

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  productType: string;
  price: number;
  discountPrice?: number;
  stock: number;
  minStock: number;
  sizes?: string[];
  colors?: string[];
  requiresCustomization: boolean;
  customizationPrice?: number;
  categoryId?: string;
  branchId?: string;
  images: string[];
  mainImage?: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  category?: { name: string };
  branch?: { name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  sku: string;
  productType: string;
  price: number;
  discountPrice?: number;
  stock: number;
  minStock?: number;
  sizes?: string[];
  colors?: string[];
  requiresCustomization?: boolean;
  customizationPrice?: number;
  categoryId?: string;
  branchId?: string;
  images?: string[];
  mainImage?: string;
  isPopular?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  isActive?: boolean;
}

const productsApi = {
  getAll: (): Promise<Product[]> => api.get('/products'),
  getById: (id: string): Promise<Product> => api.get(`/products/${id}`),
  create: (data: CreateProductDto): Promise<Product> => api.post('/products', data),
  update: (id: string, data: UpdateProductDto): Promise<Product> => api.patch(`/products/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/products/${id}`),
};

export default productsApi;