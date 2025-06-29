'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Don't show navbar on admin pages
  if (pathname.startsWith('/admin')) {
    return null
  }
  
  return <Navbar />
} 