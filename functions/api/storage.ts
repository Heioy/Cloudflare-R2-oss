import { notFound, parseBucketPath } from "@/utils/bucket";

export async function onRequestGet(context) {
  try {
    const [bucket] = parseBucketPath(context);
    if (!bucket) return notFound();

    const recentMonthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let cursor: string | undefined = undefined;
    let objectCount = 0;
    let recentMonthSize = 0;
    let totalSize = 0;

    do {
      const listed = await bucket.list({ cursor });
      for (const object of listed.objects) {
        const size = Number(object.size) || 0;
        const uploadedTime = object.uploaded
          ? new Date(object.uploaded).getTime()
          : 0;

        objectCount++;
        totalSize += size;
        if (uploadedTime && uploadedTime >= recentMonthStart) {
          recentMonthSize += size;
        }
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    return new Response(
      JSON.stringify({
        objectCount,
        recentMonthSize,
        totalSize,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(e.toString(), { status: 500 });
  }
}
