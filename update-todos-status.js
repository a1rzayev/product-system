const { PrismaClient } = require('./src/generated/prisma')

const prisma = new PrismaClient()

async function updateTodosStatus() {
  try {
    console.log('Updating existing todos with status field...')
    
    // First, get all todos
    const todos = await prisma.todo.findMany()
    console.log(`Found ${todos.length} todos`)
    
    // Update todos that don't have status or have empty status
    let updatedCount = 0
    
    for (const todo of todos) {
      if (!todo.status || todo.status === '') {
        await prisma.todo.update({
          where: { id: todo.id },
          data: { status: 'UNDONE' }
        })
        updatedCount++
      }
    }
    
    console.log(`Updated ${updatedCount} todos with UNDONE status`)
    console.log('All todos updated successfully!')
  } catch (error) {
    console.error('Error updating todos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTodosStatus() 