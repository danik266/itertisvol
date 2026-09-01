/**
 * Перекладывает готовую картинку из Replicate в наше хранилище.
 *
 * Ссылки, которые отдаёт Replicate, подписаны и живут около суток: без
 * переноса история генераций через день показывала бы пустые рамки.
 * Если хранилище не настроено или не ответило, возвращаем исходную ссылку —
 * свежую картинку волонтёр увидит в любом случае, потеряется только архив.
 */
export async function storeImage(sourceUrl: string): Promise<string> {
  const base = process.env.MEDIA_SERVER_URL;
  const token = process.env.MEDIA_TOKEN;
  if (!base || !token) return sourceUrl;

  try {
    const file = await fetch(sourceUrl, { signal: AbortSignal.timeout(20000) });
    if (!file.ok) return sourceUrl;

    const type = file.headers.get('content-type') || 'image/jpeg';
    const res = await fetch(`${base}/upload?type=${encodeURIComponent(type)}`, {
      method: 'POST',
      headers: { 'x-media-token': token, 'Content-Type': 'application/octet-stream' },
      body: Buffer.from(await file.arrayBuffer()),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return sourceUrl;

    const data = await res.json();
    return data?.name ? `/api/media/${data.name}` : sourceUrl;
  } catch (error) {
    console.error('storeImage failed:', error);
    return sourceUrl;
  }
}
