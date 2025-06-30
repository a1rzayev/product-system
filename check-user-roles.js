// const { PrismaClient } = require('@prisma/client')
const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function checkUserRoles() {
  try {
    console.log('Checking all users and their roles:')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    users.forEach(user => {
      console.log(`${user.name || user.email} - Role: ${user.role}`)
    })
    
    console.log('\nChecking admin users specifically:')
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    adminUsers.forEach(user => {
      console.log(`${user.name || user.email} - Role: ${user.role}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserRoles() 