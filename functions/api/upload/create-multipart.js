const CHUNK_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._\-]/g, '_');
}

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
  const { fileName, folder = 'memory/', contentType = 'application/octet-stream', totalSize } = body;

  if (!fileName) {
    return errorResponse('fileName is required', 400);
  }

  const bucket = env.R2_BUCKET;
  if (!bucket) {
    return errorResponse('R2 bucket not configured', 500);
  }

  const sanitizedName = sanitizeFileName(fileName);
  const key = folder + sanitizedName;

  try {
    const multipartUpload = await bucket.createMultipartUpload(key, {
      httpMetadata: { contentType },
    });

    const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

    return jsonResponse({
      ok: true,
      uploadId: multipartUpload.uploadId,
      key,
      chunkSize: CHUNK_SIZE,
      totalParts,
      publicUrl: `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
