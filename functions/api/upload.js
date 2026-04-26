export async function onRequest(context) {
  // Handle CORS preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'memory/';

    if (!file) {
      return new Response(JSON.stringify({ ok: false, error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = context.env.R2_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ ok: false, error: 'R2 bucket not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_');
    const key = folder + fileName;

    // Use stream instead of arrayBuffer to handle large files without buffering
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    const publicUrl = `https://pub-073128b2334d45f995dbaf2f0e148bb2.r2.dev/${key}`;

    return new Response(JSON.stringify({ ok: true, url: publicUrl, key, size: file.size }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
