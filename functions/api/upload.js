// R2 Upload API with Multipart Upload support for large files
// Supports both direct upload (<10MB) and multipart upload (>10MB)

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per part
const DIRECT_UPLOAD_LIMIT = 10 * 1024 * 1024; // 10MB threshold

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsResponse(null);
  }

  try {
    // Route to appropriate handler based on pathname
    if (pathname === '/api/upload' && request.method === 'POST') {
      return await handleDirectUpload(request, env);
    } else if (pathname === '/api/upload/create-multipart' && request.method === 'POST') {
      return await handleCreateMultipart(request, env);
    } else if (pathname === '/api/upload/upload-part' && request.method === 'POST') {
      return await handleUploadPart(request, env);
    } else if (pathname === '/api/upload/complete-multipart' && request.method === 'POST') {
      return await handleCompleteMultipart(request, env);
    } else {
      return errorResponse('Not found', 404);
    }
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Handle direct file upload (small files < 10MB)
 */
async function handleDirectUpload(request, env) {
  const formData = await request.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'memory/';

  if (!file) {
    return errorResponse('No file provided', 400);
  }

  if (file.size > DIRECT_UPLOAD_LIMIT) {
    return errorResponse('File too large for direct upload. Use multipart upload.', 413);
  }

  const bucket = env.R2_BUCKET;
  if (!bucket) {
    return errorResponse('R2 bucket not configured', 500);
  }

  const fileName = sanitizeFileName(file.name);
  const key = folder + fileName;

  try {
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    const publicUrl = `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`;

    return jsonResponse({ ok: true, url: publicUrl, key, size: file.size });
  } catch (error) {
    console.error('Direct upload error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Create a multipart upload session
 * Request body: { fileName, folder, contentType, totalSize }
 */
async function handleCreateMultipart(request, env) {
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
    // Create multipart upload
    const multipartUpload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType: contentType,
      },
    });

    // Calculate number of parts needed
    const totalParts = Math.ceil(totalSize / CHUNK_SIZE);

    return jsonResponse({
      ok: true,
      uploadId: multipartUpload.uploadId,
      key: key,
      chunkSize: CHUNK_SIZE,
      totalParts: totalParts,
      publicUrl: `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`,
    });
  } catch (error) {
    console.error('Create multipart error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Upload a single part
 * Request body: FormData with { uploadId, key, partNumber, chunk }
 */
async function handleUploadPart(request, env) {
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
    // Get the multipart upload object
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

    // Upload the part
    const uploadedPart = await multipartUpload.uploadPart(partNumber, chunk);

    return jsonResponse({
      ok: true,
      partNumber: partNumber,
      etag: uploadedPart.etag,
    });
  } catch (error) {
    console.error('Upload part error:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * Complete multipart upload
 * Request body: { uploadId, key, parts: [{ partNumber, etag }, ...] }
 */
async function handleCompleteMultipart(request, env) {
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
    // Get the multipart upload object
    const multipartUpload = bucket.resumeMultipartUpload(key, uploadId);

    // Complete the upload
    const completedUpload = await multipartUpload.complete(parts);

    const publicUrl = `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`;

    return jsonResponse({
      ok: true,
      url: publicUrl,
      key: key,
      etag: completedUpload.etag,
    });
  } catch (error) {
    console.error('Complete multipart error:', error);
    return errorResponse(error.message, 500);
  }
}

// Utility functions
function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._\-]/g, '_');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function errorResponse(message, status = 500) {
  return jsonResponse({ ok: false, error: message }, status);
}

function corsResponse(data) {
  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
