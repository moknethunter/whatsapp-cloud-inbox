import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const username = process.env.INBOX_AUTH_USERNAME;
  const password = process.env.INBOX_AUTH_PASSWORD;

  // ✅ إذا لم تُضبط بيانات المصادقة → اسمح بالمرور (وضع التطوير)
  if (!username || !password) {
    return NextResponse.next();
  }

  // إذا كانت مضبوطة → طالب بـ Basic Auth
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="WhatsApp Inbox"' },
    });
  }

  try {
    const decoded = atob(auth.slice(6));
    if (decoded !== `${username}:${password}`) throw new Error('bad');
  } catch {
    return new NextResponse('Invalid credentials', { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
