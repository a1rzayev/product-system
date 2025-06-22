import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create computer goods categories
  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: 'Laptops',
      description: 'Portable computers for work and play',
      slug: 'laptops'
    }
  })

  const desktops = await prisma.category.upsert({
    where: { slug: 'desktops' },
    update: {},
    create: {
      name: 'Desktops',
      description: 'Powerful desktop computers',
      slug: 'desktops'
    }
  })

  const monitors = await prisma.category.upsert({
    where: { slug: 'monitors' },
    update: {},
    create: {
      name: 'Monitors',
      description: 'High-resolution computer monitors',
      slug: 'monitors'
    }
  })

  const keyboards = await prisma.category.upsert({
    where: { slug: 'keyboards' },
    update: {},
    create: {
      name: 'Keyboards',
      description: 'Mechanical and membrane keyboards',
      slug: 'keyboards'
    }
  })

  const mice = await prisma.category.upsert({
    where: { slug: 'mice' },
    update: {},
    create: {
      name: 'Mice',
      description: 'Wired and wireless computer mice',
      slug: 'mice'
    }
  })

  const components = await prisma.category.upsert({
    where: { slug: 'components' },
    update: {},
    create: {
      name: 'Components',
      description: 'PC parts and upgrades',
      slug: 'components'
    }
  })

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      description: 'Computer accessories and peripherals',
      slug: 'accessories'
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
  const macbook = await prisma.product.upsert({
    where: { slug: 'macbook-pro-16' },
    update: {},
    create: {
      name: 'MacBook Pro 16"',
      description: 'Apple M3 Pro, 16GB RAM, 1TB SSD',
      slug: 'macbook-pro-16',
      sku: 'MBP-16-M3-1TB',
      price: 2999.99,
      comparePrice: 3199.99,
      isActive: true,
      isFeatured: true,
      weight: 2100,
      dimensions: JSON.stringify({ length: 355.7, width: 248.1, height: 16.8 }),
      categoryId: laptops.id
    }
  })

  const dellDesktop = await prisma.product.create({
    data: {
      name: 'Dell XPS Desktop',
      description: 'Intel i9, 32GB RAM, RTX 4070, 2TB SSD',
      slug: 'dell-xps-desktop',
      sku: 'DELL-XPS-I9-4070',
      price: 2499.99,
      comparePrice: 2699.99,
      isActive: true,
      isFeatured: true,
      weight: 8000,
      dimensions: JSON.stringify({ length: 400, width: 180, height: 420 }),
      categoryId: desktops.id
    }
  })

  const lgMonitor = await prisma.product.create({
    data: {
      name: 'LG UltraFine 4K Monitor',
      description: '27-inch, 4K UHD, USB-C',
      slug: 'lg-ultrafine-4k',
      sku: 'LG-4K-27',
      price: 599.99,
      comparePrice: 699.99,
      isActive: true,
      isFeatured: false,
      weight: 4500,
      dimensions: JSON.stringify({ length: 613, width: 230, height: 464 }),
      categoryId: monitors.id
    }
  })

  const logitechKeyboard = await prisma.product.create({
    data: {
      name: 'Logitech MX Keys',
      description: 'Wireless illuminated keyboard',
      slug: 'logitech-mx-keys',
      sku: 'LOGI-MX-KEYS',
      price: 119.99,
      comparePrice: 139.99,
      isActive: true,
      isFeatured: false,
      weight: 800,
      dimensions: JSON.stringify({ length: 430, width: 131, height: 20 }),
      categoryId: keyboards.id
    }
  })

  const logitechMouse = await prisma.product.create({
    data: {
      name: 'Logitech MX Master 3S',
      description: 'Wireless ergonomic mouse',
      slug: 'logitech-mx-master-3s',
      sku: 'LOGI-MX-MASTER-3S',
      price: 99.99,
      comparePrice: 119.99,
      isActive: true,
      isFeatured: false,
      weight: 141,
      dimensions: JSON.stringify({ length: 124.9, width: 84.3, height: 51 }),
      categoryId: mice.id
    }
  })

  const samsungSSD = await prisma.product.create({
    data: {
      name: 'Samsung 990 PRO SSD',
      description: '2TB NVMe PCIe Gen4 SSD',
      slug: 'samsung-990-pro-2tb',
      sku: 'SAMSUNG-990PRO-2TB',
      price: 179.99,
      comparePrice: 199.99,
      isActive: true,
      isFeatured: false,
      weight: 30,
      dimensions: JSON.stringify({ length: 80, width: 22, height: 2.3 }),
      categoryId: components.id
    }
  })

  const usbHub = await prisma.product.create({
    data: {
      name: 'Anker USB-C Hub',
      description: '7-in-1 USB-C hub with HDMI, SD, and more',
      slug: 'anker-usb-c-hub',
      sku: 'ANKER-USB-C-HUB',
      price: 49.99,
      comparePrice: 59.99,
      isActive: true,
      isFeatured: false,
      weight: 120,
      dimensions: JSON.stringify({ length: 115, width: 45, height: 14 }),
      categoryId: accessories.id
    }
  })

  // Create an inactive product for testing
  const inactiveProduct = await prisma.product.upsert({
    where: { slug: 'discontinued-product' },
    update: {
      isActive: false // Ensure it's inactive
    },
    create: {
      name: 'Discontinued Product',
      description: 'This product is no longer available for purchase',
      slug: 'discontinued-product',
      sku: 'DISCONTINUED-001',
      price: 99.99,
      comparePrice: 129.99,
      isActive: false,
      isFeatured: false,
      weight: 500,
      dimensions: JSON.stringify({ length: 100, width: 50, height: 25 }),
      categoryId: accessories.id
    }
  })

  // Create product images
  await prisma.productImage.createMany({
    data: [
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'MacBook Pro 16"',
        isPrimary: true,
        order: 0,
        productId: macbook.id
      },
      {
        url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=800',
        alt: 'Dell XPS Desktop',
        isPrimary: true,
        order: 0,
        productId: dellDesktop.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'LG UltraFine 4K Monitor',
        isPrimary: true,
        order: 0,
        productId: lgMonitor.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'Logitech MX Keys',
        isPrimary: true,
        order: 0,
        productId: logitechKeyboard.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'Logitech MX Master 3S',
        isPrimary: true,
        order: 0,
        productId: logitechMouse.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'Samsung 990 PRO SSD',
        isPrimary: true,
        order: 0,
        productId: samsungSSD.id
      },
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        alt: 'Anker USB-C Hub',
        isPrimary: true,
        order: 0,
        productId: usbHub.id
      }
    ]
  })

  // Create inventory
  await prisma.inventory.createMany({
    data: [
      { quantity: 20, reserved: 0, productId: macbook.id },
      { quantity: 10, reserved: 0, productId: dellDesktop.id },
      { quantity: 30, reserved: 0, productId: lgMonitor.id },
      { quantity: 50, reserved: 0, productId: logitechKeyboard.id },
      { quantity: 40, reserved: 0, productId: logitechMouse.id },
      { quantity: 100, reserved: 0, productId: samsungSSD.id },
      { quantity: 60, reserved: 0, productId: usbHub.id }
    ]
  })

  console.log('✅ Database seeded with computer goods!')
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