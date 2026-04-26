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

  const formData = await request.formData();
  const uploadId = formData.get('uploadId');
  const key = formData.get('key');
  const partNumber = parseInt(formData.get('partNumber'), 10);
  const chunk = formData.get('chunk');

  if (!uploadId || !key || !partNumber || !chunk) {
    return errorResponse('Missing required fields: uploadId, key, partNumber, chunk', 400);
  }

  const bucket = env.R2_BUCKET;
  if (!bucket) {
    return errorResponse('R2 bucket not configured', 500);
  }

  try {
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);
    const uploadedPart = await multipartUpload.uploadPart(partNumber, chunk);

    return jsonResponse({
      ok: true,
      partNumber,
      etag: uploadedPart.etag,
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
