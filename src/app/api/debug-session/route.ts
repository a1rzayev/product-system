import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'No session found',
        session: null
      })
    }

    // Get all users from database
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    })

    // Try to find the session user in database
    const sessionUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true }
    })

    return NextResponse.json({
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        }
      },
      databaseUsers: allUsers,
      sessionUserFound: !!sessionUser,
      sessionUser: sessionUser,
      sessionUserId: session.user.id,
      sessionUserEmail: session.user.email
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({ 
      error: 'Debug error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 