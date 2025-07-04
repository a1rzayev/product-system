import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { role } = await request.json()

    // Validate role
    const validRoles = ['ADMIN', 'USER', 'CUSTOMER']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: 'Invalid role. Must be ADMIN, USER, or CUSTOMER' },
        { status: 400 }
      )
    }

    // Get the user to be updated
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, email: true }
    })

    if (!userToUpdate) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Prevent admins from changing other admins' roles
    if (userToUpdate.role === 'ADMIN' && session.user.id !== params.id) {
      return NextResponse.json(
        { message: 'Cannot change role of other admin users' },
        { status: 403 }
      )
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('User role update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 