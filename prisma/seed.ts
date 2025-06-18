import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      slug: 'electronics'
    }
  })

  const clothing = await prisma.category.create({
    data: {
      name: 'Clothing',
      description: 'Fashion and apparel',
      slug: 'clothing'
    }
  })

  const home = await prisma.category.create({
    data: {
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
      slug: 'home-garden'
    }
  })

  // Create subcategories
  const smartphones = await prisma.category.create({
    data: {
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      slug: 'smartphones',
      parentId: electronics.id
    }
  })

  const laptops = await prisma.category.create({
    data: {
      name: 'Laptops',
      description: 'Portable computers',
      slug: 'laptops',
      parentId: electronics.id
    }
  })

  const mensClothing = await prisma.category.create({
    data: {
      name: "Men's Clothing",
      description: 'Clothing for men',
      slug: 'mens-clothing',
      parentId: clothing.id
    }
  })

  const womensClothing = await prisma.category.create({
    data: {
      name: "Women's Clothing",
      description: 'Clothing for women',
      slug: 'womens-clothing',
      parentId: clothing.id
    }
  })

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10)
  const customerPassword = await bcrypt.hash('customer123', 10)

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN'
    }
  })

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      name: 'John Doe',
      password: customerPassword,
      role: 'CUSTOMER'
    }
  })

  // Create products
  const iphone = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      description: 'The latest iPhone with advanced features and powerful performance.',
      slug: 'iphone-15-pro',
      sku: 'IPHONE-15-PRO-128',
      price: 999.99,
      comparePrice: 1099.99,
      isActive: true,
      isFeatured: true,
      weight: 187,
      dimensions: JSON.stringify({ length: 147.6, width: 71.6, height: 8.25 }),
      categoryId: smartphones.id
    }
  })

  const macbook = await prisma.product.create({
    data: {
      name: 'MacBook Pro 14"',
      description: 'Professional laptop with M3 chip for ultimate performance.',
      slug: 'macbook-pro-14',
      sku: 'MBP-14-M3-512',
      price: 1999.99,
      comparePrice: 2199.99,
      isActive: true,
      isFeatured: true,
      weight: 1600,
      dimensions: JSON.stringify({ length: 312.6, width: 221.2, height: 15.5 }),
      categoryId: laptops.id
    }
  })

  const tshirt = await prisma.product.create({
    data: {
      name: 'Premium Cotton T-Shirt',
      description: 'Comfortable and stylish cotton t-shirt for everyday wear.',
      slug: 'premium-cotton-tshirt',
      sku: 'TSHIRT-COTTON-M',
      price: 29.99,
      comparePrice: 39.99,
      isActive: true,
      isFeatured: false,
      weight: 180,
      categoryId: mensClothing.id
    }
  })

  const dress = await prisma.product.create({
    data: {
      name: 'Summer Floral Dress',
      description: 'Beautiful floral print dress perfect for summer occasions.',
      slug: 'summer-floral-dress',
      sku: 'DRESS-FLORAL-M',
      price: 89.99,
      comparePrice: 119.99,
      isActive: true,
      isFeatured: true,
      weight: 250,
      categoryId: womensClothing.id
    }
  })

  // Create product images
  await prisma.productImage.createMany({
    data: [
      {
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
        alt: 'iPhone 15 Pro',
        isPrimary: true,
        order: 0,
        productId: iphone.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'MacBook Pro 14"',
        isPrimary: true,
        order: 0,
        productId: macbook.id
      },
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        alt: 'Premium Cotton T-Shirt',
        isPrimary: true,
        order: 0,
        productId: tshirt.id
      },
      {
        url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
        alt: 'Summer Floral Dress',
        isPrimary: true,
        order: 0,
        productId: dress.id
      }
    ]
  })

  // Create product variants
  await prisma.productVariant.createMany({
    data: [
      {
        name: 'Storage',
        value: '128GB',
        sku: 'IPHONE-15-PRO-128',
        productId: iphone.id
      },
      {
        name: 'Storage',
        value: '256GB',
        sku: 'IPHONE-15-PRO-256',
        price: 1099.99,
        productId: iphone.id
      },
      {
        name: 'Storage',
        value: '512GB',
        sku: 'IPHONE-15-PRO-512',
        price: 1299.99,
        productId: iphone.id
      },
      {
        name: 'Size',
        value: 'Small',
        sku: 'TSHIRT-COTTON-S',
        productId: tshirt.id
      },
      {
        name: 'Size',
        value: 'Medium',
        sku: 'TSHIRT-COTTON-M',
        productId: tshirt.id
      },
      {
        name: 'Size',
        value: 'Large',
        sku: 'TSHIRT-COTTON-L',
        productId: tshirt.id
      },
      {
        name: 'Size',
        value: 'Small',
        sku: 'DRESS-FLORAL-S',
        productId: dress.id
      },
      {
        name: 'Size',
        value: 'Medium',
        sku: 'DRESS-FLORAL-M',
        productId: dress.id
      },
      {
        name: 'Size',
        value: 'Large',
        sku: 'DRESS-FLORAL-L',
        productId: dress.id
      }
    ]
  })

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      {
        quantity: 50,
        reserved: 0,
        productId: iphone.id
      },
      {
        quantity: 25,
        reserved: 0,
        productId: macbook.id
      },
      {
        quantity: 100,
        reserved: 0,
        productId: tshirt.id
      },
      {
        quantity: 75,
        reserved: 0,
        productId: dress.id
      }
    ]
  })

  // Create reviews
  await prisma.review.createMany({
    data: [
      {
        rating: 5,
        title: 'Excellent phone!',
        comment: 'The iPhone 15 Pro is amazing. Great camera and performance.',
        isVerified: true,
        userId: customer.id,
        productId: iphone.id
      },
      {
        rating: 4,
        title: 'Great laptop',
        comment: 'Very fast and reliable. Perfect for work and development.',
        isVerified: true,
        userId: customer.id,
        productId: macbook.id
      },
      {
        rating: 5,
        title: 'Comfortable t-shirt',
        comment: 'High quality cotton, very comfortable to wear.',
        isVerified: true,
        userId: customer.id,
        productId: tshirt.id
      }
    ]
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Admin email: admin@example.com')
  console.log('📧 Customer email: customer@example.com')
  console.log('🔑 Password: admin123 / customer123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 