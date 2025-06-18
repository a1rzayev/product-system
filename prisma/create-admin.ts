import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for admin user...')

  // Check if admin user already exists with old email
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  })

  // Check if admin user already exists with new email
  const newAdminExists = await prisma.user.findUnique({
    where: { email: 'admin@mail.com' }
  })

  if (newAdminExists) {
    console.log('✅ Admin user already exists with new email!')
    console.log('📧 Email: admin@mail.com')
    console.log('🔑 Password: admin123')
    return
  }

  // Hash password
  const adminPassword = await bcrypt.hash('admin123', 10)

  if (existingAdmin) {
    // Update existing admin user with new email
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: {
        email: 'admin@mail.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN'
      }
    })
    console.log('✅ Admin user updated successfully!')
    console.log('📧 Email: admin@mail.com')
    console.log('🔑 Password: admin123')
    console.log('🆔 User ID:', updatedAdmin.id)
  } else {
    // Create new admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@mail.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN'
      }
    })
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@mail.com')
    console.log('🔑 Password: admin123')
    console.log('🆔 User ID:', admin.id)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error creating/updating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 