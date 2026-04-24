export interface Product {
  id: string
  tenantId: string
  name: string
  description: string | null
  price: number
  comparePrice: number | null
  stock: number
  sku: string | null
  imageUrls: string[]
  category: string | null
  tags: string[]
  isActive: boolean | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface PublicProduct {
  id: string
  name: string
  description: string | null
  price: number
  comparePrice: number | null
  imageUrls: string[]
  category: string | null
  tags: string[]
  createdAt: Date | null
}

export interface CreateProductInput {
  name: string
  description?: string
  price: number
  comparePrice?: number
  stock: number
  sku?: string
  imageUrls?: string[]
  category?: string
  tags?: string[]
  isActive?: boolean
}

export interface UpdateProductInput {
  name?: string
  description?: string
  price?: number
  comparePrice?: number
  stock?: number
  sku?: string
  imageUrls?: string[]
  category?: string
  tags?: string[]
  isActive?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface Order {
  id: string
  tenantId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: ShippingAddress
  items: OrderItem[]
  subtotal: number
  taxAmount: number | null
  shippingFee: number | null
  discountAmount: number | null
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | null
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | null
  paymentMethod: string | null
  trackingNumber: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CreateOrderInput {
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress: ShippingAddress
  items: Array<{ productId: string; quantity: number }>
}

export interface OrderStatusUpdate {
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
}

export interface PublicOrderTracking {
  orderNumber: string
  status: string
  items: Array<{ name: string; quantity: number }>
  shippingAddress: unknown
  createdAt: Date | null
  estimatedDelivery: string | null
}
