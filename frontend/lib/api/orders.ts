import api from '../axios';

export type OrderStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'PAID'
  | 'PROCESSING'
  | 'READY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  size?: string;
  color?: string;
  customization?: string;
  subtotal: number;
  product?: { mainImage?: string };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  studentId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  deliveryMethod: string;
  pickupBranchId?: string;
  deliveryAddress?: string;
  reservationExpiresAt?: string;
  orderDate: string;
  orderItems: OrderItem[];
  pickupBranch?: { name: string };
  orderHistory?: Array<{ status: OrderStatus; note?: string; createdAt: string }>;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  customization?: string;
}

export interface CreateOrderDto {
  userId?: string;
  studentId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  items: CreateOrderItemDto[];
  deliveryMethod?: string;
  pickupBranchId?: string;
  deliveryAddress?: string;
  shippingCost?: number;
  paymentMethod?: string;
  mode?: 'PAY' | 'RESERVE';
  notes?: string;
}

export interface SalesStats {
  today: number;
  week: number;
  month: number;
  topProducts: Array<{ productId: string; name: string; qty: number }>;
  byCategory: Record<string, number>;
  totalOrders: number;
}

const ordersApi = {
  create: (data: CreateOrderDto): Promise<Order> => api.post('/orders', data),
  getMine: (): Promise<Order[]> => api.get('/orders/my'),
  getAll: (): Promise<Order[]> => api.get('/orders'),
  getById: (id: string): Promise<Order> => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus, note?: string): Promise<Order> =>
    api.patch(`/orders/${id}/status`, { status, note }),
  cancel: (id: string): Promise<Order> => api.delete(`/orders/${id}`),
  getSalesStats: (): Promise<SalesStats> => api.get('/orders/stats/sales'),
};

export default ordersApi;
