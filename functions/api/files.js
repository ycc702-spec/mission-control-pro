/**
 * Cloudflare Pages Function: List files in R2 bucket
 * GET /api/files
 */

export async function onRequest(context) {
    try {
        const bucket = context.env.R2_BUCKET;
        
        if (!bucket) {
            return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // List all files in the bucket
        const listResult = await bucket.list();
        
        // Transform the result to include file metadata
        const files = listResult.objects.map(obj => ({
            key: obj.key,
            size: obj.size,
            lastModified: obj.uploaded,
            etag: obj.etag,
        }));
        
        // Sort by upload time (newest first)
        files.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        return new Response(JSON.stringify({
            ok: true,
            files: files,
            total: files.length,
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
            }
        });
    } catch (error) {
        console.error('Error listing files:', error);
        return new Response(JSON.stringify({
            ok: false,
            error: error.message || 'Failed to list files',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
