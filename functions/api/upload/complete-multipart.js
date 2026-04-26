function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ ok: false, error: message }, status);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const body = await request.json();
  const { uploadId, key, parts } = body;

  if (!uploadId || !key || !parts || !Array.isArray(parts)) {
    return errorResponse('Missing required fields: uploadId, key, parts', 400);
  }

  const bucket = env.R2_BUCKET;
  if (!bucket) {
    return errorResponse('R2 bucket not configured', 500);
  }

  try {
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
    const completedUpload = await multipartUpload.complete(parts);
    const publicUrl = `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`;

    return jsonResponse({
      ok: true,
      url: publicUrl,
      key,
      etag: completedUpload.etag,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
