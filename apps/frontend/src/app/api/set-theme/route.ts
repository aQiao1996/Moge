import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RequestBody {
  theme: 'light' | 'dark';
}

export async function POST(request: NextRequest) {
  try {
    const { theme } = (await request.json()) as RequestBody;
    if (theme === 'light' || theme === 'dark') {
      const response = NextResponse.json({ code: 200, data: null, message: 'success' });
      response.cookies.set('theme', theme, { path: '/', maxAge: 60 * 60 * 24 * 365 }); // 1年
      return response;
    }
    return NextResponse.json({ code: 400, data: null, message: 'Invalid theme' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { code: 500, data: null, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
