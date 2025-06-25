// Product System Types

export interface User {
  id: string
  email: string
  name?: string
  role: 'ADMIN' | 'USER' | 'CUSTOMER'
  createdAt: Date
  updatedAt: Date
  _count?: {
    orders: number
  }
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parentId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  parent?: Category
  children?: Category[]
  products?: Product[]
  images?: CategoryImage[]
  _count?: {
    products: number
    children: number
  }
}

export interface CategoryImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
  order: number
  categoryId: string
  createdAt: Date
}

export interface Product {
  id: string
  name: string
  description: string
  slug: string
  sku: string
  price: number
  comparePrice?: number
  isActive: boolean
  isFeatured: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  notes?: string
  categoryId: string
  createdAt: Date
  updatedAt: Date
  category?: Category
  images?: ProductImage[]
  variants?: ProductVariant[]
  inventory?: Inventory
  reviews?: Review[]
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  isPrimary: boolean
  order: number
  productId: string
  createdAt: Date
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  sku: string
  price?: number
  productId: string
  createdAt: Date
  updatedAt: Date
}

export interface Inventory {
  id: string
  quantity: number
  reserved: number
  productId: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  total: number
  subtotal: number
  tax: number
  shipping: number
  discount: number
  customerId: string
  shippingAddress: Address
  billingAddress: Address
  notes?: string
  createdAt: Date
  updatedAt: Date
  customer?: User
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  quantity: number
  price: number
  orderId: string
  productId: string
  variantId?: string
  createdAt: Date
  product?: Product
  variant?: ProductVariant
}

export interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  isVerified: boolean
  userId: string
  productId: string
  createdAt: Date
  updatedAt: Date
  user?: User
  product?: Product
}

export interface CartItem {
  id: string
  quantity: number
  userId: string
  productId: string
  variantId?: string
  createdAt: Date
  updatedAt: Date
  product?: Product
  variant?: ProductVariant
}

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface CreateProductForm {
  name: string
  description: string
  slug: string
  sku: string
  price: number
  comparePrice?: number
  categoryId: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  isActive: boolean
  isFeatured: boolean
}

export interface CreateCategoryForm {
  name: string
  description?: string
  slug: string
  parentId?: string
  notes?: string
  images?: {
    url: string
    alt?: string
    isPrimary?: boolean
    order?: number
  }[]
}

export interface CreateUserForm {
  email: string
  name?: string
  password: string
  role: 'ADMIN' | 'CUSTOMER'
}

export interface LoginForm {
  email: string
  password: string
}

export interface CreateOrderForm {
  customerId: string
  items: {
    productId: string
    variantId?: string
    quantity: number
  }[]
  shippingAddress: Address
  billingAddress: Address
  notes?: string
}

export interface CreateReviewForm {
  rating: number
  title?: string
  comment?: string
  productId: string
} 