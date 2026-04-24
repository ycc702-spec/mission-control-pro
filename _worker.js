export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Default to index.html for root
    if (pathname === '/') {
      pathname = '/index.html';
    }
    
    // Try to get the file from the deployment
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && pathname !== '/index.html') {
        // If file not found and it's not index.html, try index.html
        return await env.ASSETS.fetch(new Request(new URL('/index.html', url).toString(), request));
      }
      return response;
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
};
