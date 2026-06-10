import { NextResponse, type NextRequest } from "next/server"

import { TOKEN_COOKIE } from "@/lib/auth"

// En Next.js 16 el middleware se llama "proxy".
// Protege todas las rutas privadas chequeando la presencia del token en cookie.
// La validación real del JWT la hace la API (responde 401, manejado por el interceptor).
export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const isLogin = request.nextUrl.pathname.startsWith("/login")

  if (!token && !isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (token && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  // Corre en todo excepto API interna, assets de Next y archivos con extensión.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
