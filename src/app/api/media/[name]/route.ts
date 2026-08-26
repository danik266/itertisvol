import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Раздача файла из хранилища: проксируем, так как оно доступно только по HTTP. */
export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const base = process.env.MEDIA_SERVER_URL;
  if (!base) return new NextResponse('storage not configured', { status: 503 });

  if (!/^[a-f0-9]{32}\.[a-z0-9]{3,4}$/.test(params.name)) {
    return new NextResponse('bad name', { status: 400 });
  }

  try {
    const res = await fetch(`${base}/f/${params.name}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return new NextResponse('not found', { status: res.status });

    return new NextResponse(res.body, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('storage unavailable', { status: 502 });
  }
}
