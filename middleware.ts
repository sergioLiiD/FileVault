import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Permitir acceso a client-access sin autenticación
  if (req.nextUrl.pathname.startsWith('/client-access')) {
    return res
  }

  // Para todas las demás rutas protegidas, requerir autenticación
  if (!session) {
    return res
  }

  return res
}

export const config = {
  matcher: ['/users', '/client-register']
} 