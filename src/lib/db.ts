import { prisma } from './prisma'
import type {
  Product,
  Category,
  User,
  Order,
  Review,
  CartItem,
  CreateProductForm,
  CreateCategoryForm,
  CreateUserForm,
  CreateOrderForm,
  CreateReviewForm,
  PaginatedResponse
} from '../types'

// Helper to parse dimensions
function parseProductDimensions(product: any): any {
  if (!product) return product
  return {
    ...product,
    dimensions: product.dimensions ? JSON.parse(product.dimensions) : undefined
  }
}

// Product operations
export const productService = {
  // Get all products with pagination
  async getAll(page = 1, limit = 10, categoryId?: string, search?: string): Promise<PaginatedResponse<Product>> {
    const skip = (page - 1) * limit
    const where: any = { isActive: true }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { order: 'asc' } },
          variants: true,
          inventory: true,
          reviews: {
            include: { user: { select: { name: true } } }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    // Parse dimensions for all products
    const parsedProducts = products.map((product: any) => parseProductDimensions(product))

    return {
      data: parsedProducts as Product[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        variants: true,
        inventory: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    if (!product) return null
    return parseProductDimensions(product) as Product
  },

  // Get product by slug
  async getBySlug(slug: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        variants: true,
        inventory: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    if (!product) return null
    return parseProductDimensions(product) as Product
  },

  // Create new product
  async create(data: CreateProductForm): Promise<Product> {
    const product = await prisma.product.create({
      data: {
        ...data,
        price: data.price,
        comparePrice: data.comparePrice,
        dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null
      },
      include: {
        category: true,
        images: true,
        variants: true,
        inventory: true
      }
    })
    return parseProductDimensions(product) as Product
  },

  // Update product
  async update(id: string, data: Partial<CreateProductForm>): Promise<Product> {
    const updateData: any = { ...data }
    if (data.dimensions) {
      updateData.dimensions = JSON.stringify(data.dimensions)
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        variants: true,
        inventory: true
      }
    })
    return parseProductDimensions(product) as Product
  },

  // Delete product
  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } })
  },

  // Get featured products
  async getFeatured(limit = 8): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
        inventory: true
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
    return products as Product[]
  }
}

// Category operations
export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        images: { orderBy: { order: 'asc' } },
        _count: { select: { products: true } }
      },
      orderBy: { name: 'asc' }
    })
    return categories as Category[]
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        images: { orderBy: { order: 'asc' } },
        products: {
          where: { isActive: true },
          include: { images: true, inventory: true }
        }
      }
    })
    return category as Category | null
  },

  // Create category
  async create(data: CreateCategoryForm): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        parentId: data.parentId,
        notes: data.notes,
        images: data.images && data.images.length > 0 ? {
          create: data.images.map((image: any, index: number) => ({
            url: image.url,
            alt: image.alt || '',
            isPrimary: image.isPrimary || index === 0,
            order: image.order || index
          }))
        } : undefined
      },
      include: { 
        parent: true, 
        children: true,
        images: { orderBy: { order: 'asc' } }
      }
    })
    return category as Category
  },

  // Update category
  async update(id: string, data: Partial<CreateCategoryForm>): Promise<Category> {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        slug: data.slug,
        parentId: data.parentId,
        notes: data.notes,
        images: data.images ? {
          deleteMany: {},
          create: data.images.map((image: any, index: number) => ({
            url: image.url,
            alt: image.alt || '',
            isPrimary: image.isPrimary || index === 0,
            order: image.order || index
          }))
        } : undefined
      },
      include: { 
        parent: true, 
        children: true,
        images: { orderBy: { order: 'asc' } }
      }
    })
    return category as Category
  },

  // Delete category
  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } })
  }
}

// User operations
export const userService = {
  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { orders: true }
    })
    return user as User | null
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { orders: true }
    })
    return user as User | null
  },

  // Create user
  async create(data: CreateUserForm): Promise<User> {
    const user = await prisma.user.create({
      data: {
        ...data,
        password: data.password // Note: In production, hash the password
      }
    })
    return user as User
  },

  // Update user
  async update(id: string, data: Partial<CreateUserForm>): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data
    })
    return user as User
  }
}

// Order operations
export const orderService = {
  // Get orders by user
  async getByUser(userId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: { include: { images: true } },
            variant: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    // Parse shippingAddress, billingAddress, and product dimensions
    return orders.map((order: any) => ({
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : undefined,
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : undefined,
      items: order.items.map((item: any) => ({
        ...item,
        product: parseProductDimensions(item.product)
      }))
    })) as Order[]
  },

  // Get order by ID
  async getById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: { include: { images: true } },
            variant: true
          }
        }
      }
    })
    if (!order) return null
    return {
      ...order,
      shippingAddress: order.shippingAddress ? JSON.parse(order.shippingAddress) : undefined,
      billingAddress: order.billingAddress ? JSON.parse(order.billingAddress) : undefined,
      items: order.items.map((item: any) => ({
        ...item,
        product: parseProductDimensions(item.product)
      }))
    } as Order
  },

  // Create order
  async create(data: CreateOrderForm): Promise<Order> {
    // Calculate totals
    const items = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true }
        })
        
        let price = product!.price
        if (item.variantId) {
          const variant = product!.variants.find(v => v.id === item.variantId)
          price = variant?.price || price
        }
        
        return { ...item, price }
      })
    )

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * 0.1 // 10% tax
    const shipping = 10 // Fixed shipping cost
    const total = subtotal + tax + shipping

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        total,
        subtotal,
        tax,
        shipping,
        customerId: data.customerId,
        shippingAddress: JSON.stringify(data.shippingAddress),
        billingAddress: JSON.stringify(data.billingAddress),
        notes: data.notes,
        items: {
          create: items.map(item => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
            variantId: item.variantId
          }))
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: { include: { images: true } },
            variant: true
          }
        }
      }
    })
    return order as Order
  },

  // Update order status
  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: {
          include: {
            product: { include: { images: true } },
            variant: true
          }
        }
      }
    })
    return order as Order
  }
}

// Review operations
export const reviewService = {
  // Get reviews by product
  async getByProduct(productId: string): Promise<Review[]> {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return reviews as Review[]
  },

  // Create review
  async create(data: CreateReviewForm, userId: string): Promise<Review> {
    const review = await prisma.review.create({
      data: {
        ...data,
        userId
      },
      include: { user: { select: { name: true } } }
    })
    return review as Review
  },

  // Update review
  async update(id: string, data: Partial<CreateReviewForm>): Promise<Review> {
    const review = await prisma.review.update({
      where: { id },
      data,
      include: { user: { select: { name: true } } }
    })
    return review as Review
  },

  // Delete review
  async delete(id: string): Promise<void> {
    await prisma.review.delete({ where: { id } })
  }
}

// Cart operations
export const cartService = {
  // Get user's cart
  async getByUser(userId: string): Promise<CartItem[]> {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: { include: { images: true, inventory: true } },
        variant: true
      },
      orderBy: { createdAt: 'desc' }
    })
    // Parse product dimensions
    return cartItems.map((item: any) => ({
      ...item,
      product: parseProductDimensions(item.product)
    })) as CartItem[]
  },

  // Add item to cart
  async addItem(userId: string, productId: string, quantity: number, variantId?: string): Promise<CartItem> {
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId,
          productId,
          variantId: variantId || null
        }
      },
      update: { quantity },
      create: {
        userId,
        productId,
        variantId,
        quantity
      },
      include: {
        product: { include: { images: true, inventory: true } },
        variant: true
      }
    })
    return cartItem as CartItem
  },

  // Update cart item quantity
  async updateQuantity(id: string, quantity: number): Promise<CartItem> {
    const cartItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: {
        product: { include: { images: true, inventory: true } },
        variant: true
      }
    })
    return cartItem as CartItem
  },

  // Remove item from cart
  async removeItem(id: string): Promise<void> {
    await prisma.cartItem.delete({ where: { id } })
  },

  // Clear user's cart
  async clearCart(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { userId } })
  }
} 