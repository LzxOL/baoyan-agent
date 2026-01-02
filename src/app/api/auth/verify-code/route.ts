import { NextResponse } from 'next/server';
import { codes } from '../send-code/route';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase();
    const code = String(body.code || '').trim();
    if (!email || !code) return NextResponse.json({ message: 'email and code required' }, { status: 400 });

    const entry = codes.get(email);
    if (!entry) return NextResponse.json({ message: 'no code sent' }, { status: 400 });
    if (Date.now() > entry.expiresAt) {
      codes.delete(email);
      return NextResponse.json({ message: 'code expired' }, { status: 400 });
    }
    if (entry.code !== code) return NextResponse.json({ message: 'invalid code' }, { status: 400 });

    // 验证通过后移除
    codes.delete(email);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'error' }, { status: 500 });
  }
}




