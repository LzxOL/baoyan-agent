// @ts-ignore
import { NextResponse } from 'next/server';

const PY_PARSE_URL = process.env.PY_PARSE_URL || 'http://127.0.0.1:8000/parse';

export async function POST(request: Request) {
  const { text } = await request.json();
  if (!text || !text.trim()) return NextResponse.json({ items: [] });

  try {
    const res = await fetch(PY_PARSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return NextResponse.json({ items: [], error: `python service error ${res.status} ${txt}` }, { status: 502 });
    }
    const items = await res.json();
    // If client provided materials in request body, pass-through; otherwise return items only
    // Accept optional materials payload from frontend
    try {
      const body = await request.json().catch(() => ({}));
      const materials = body.materials || null;
      if (materials && Array.isArray(materials)) {
        // call python /match
        const mres = await fetch((process.env.PY_MATCH_URL || 'http://127.0.0.1:8000/match'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, materials }),
        });
        if (mres.ok) {
          const matched = await mres.json();
          return NextResponse.json({ items, matches: matched }, { status: 200 });
        } else {
          const txt = await mres.text().catch(() => '');
          return NextResponse.json({ items, matches: [], error: `match service error ${mres.status} ${txt}` }, { status: 200 });
        }
      }
    } catch (e) {
      console.error('route post match call failed', e);
    }
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 502 });
  }
}

// Simple GET handler for health/check and quick testing
export async function GET() {
  return NextResponse.json({ ok: true, route: '/api/agent/parse' });
}


