import { NextResponse } from 'next/server';

// 简单的内存存储，仅用于开发/测试（重启后失效）。
const codes = new Map<string, { code: string; expiresAt: number }>();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').toLowerCase();
    if (!email) return NextResponse.json({ message: 'email required' }, { status: 400 });

    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    codes.set(email, { code, expiresAt });

    // 开发环境：把验证码打印到服务器控制台，方便测试。
    // 生产时请用 SMTP/第三方邮件服务发送邮件并将验证码持久化到数据库。
    // 注意：这里不会实际发送邮件。
    // eslint-disable-next-line no-console
    console.log(`[DEV EMAIL CODE] send to ${email}: ${code} (expires in 10m)`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'error' }, { status: 500 });
  }
}

export { codes };




