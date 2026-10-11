export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, 'https://api.jooart.uk');

  const newHeaders = new Headers(context.request.headers);
  newHeaders.set('Host', 'api.jooart.uk');

  const forwardRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: newHeaders,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'follow',
  });

  return fetch(forwardRequest);
}
