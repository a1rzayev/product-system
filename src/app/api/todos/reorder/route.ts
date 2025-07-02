import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { todoIds } = await request.json()

    if (!Array.isArray(todoIds) || todoIds.length === 0) {
      return NextResponse.json({ error: 'Invalid todo IDs array' }, { status: 400 })
    }

    // Update the order of todos by setting a position field
    // We'll use the index as the position
    const updatePromises = todoIds.map((todoId: string, index: number) => 
      prisma.todo.update({
        where: { id: todoId },
        data: { position: index }
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ message: 'Todos reordered successfully' })
  } catch (error) {
    console.error('Error reordering todos:', error)
    return NextResponse.json({ error: 'Failed to reorder todos' }, { status: 500 })
  }
} 