import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('Profile GET: No session or user')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('Profile GET: User is not admin', { role: session.user.role })
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    console.log('Profile GET: Fetching user data for ID:', session.user.id)

    // Fetch current user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      console.log('Profile GET: User not found in database')
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    console.log('Profile GET: User data fetched successfully:', user)

    return NextResponse.json({
      user
    })

  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log('Profile update: No session or user')
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.log('Profile update: User is not admin', { role: session.user.role })
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    console.log('Profile update request:', {
      userId: session.user.id,
      name,
      email,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword
    })

    // Validate required fields
    if (!name || !email) {
      console.log('Profile update: Missing required fields')
      return NextResponse.json({ message: 'Name and email are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('Profile update: Invalid email format')
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 })
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: session.user.id }
      }
    })

    if (existingUser) {
      console.log('Profile update: Email already taken by another user')
      return NextResponse.json({ message: 'Email is already taken' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      name,
      email
    }

    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        console.log('Profile update: Current password required but not provided')
        return NextResponse.json({ message: 'Current password is required to change password' }, { status: 400 })
      }

      // Verify current password
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user) {
        console.log('Profile update: User not found in database')
        return NextResponse.json({ message: 'User not found' }, { status: 404 })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        console.log('Profile update: Current password is incorrect')
        return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedPassword
      console.log('Profile update: Password will be updated')
    }

    console.log('Profile update: Updating user with data:', updateData)

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('Profile update: User updated successfully:', updatedUser)

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
} 