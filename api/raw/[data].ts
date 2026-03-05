import { decompressAuto } from '../../src/compression'

export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const data = pathParts[pathParts.length - 1]
  const p = url.searchParams.get('p')

  if (!data) {
    return new Response('Missing data segment.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  let result
  try {
    result = decompressAuto(data)
  } catch {
    return new Response('Invalid or unrecognized data.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  if (!result.encrypted) {
    return new Response(result.text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  if (!p) {
    return new Response(
      'This document is encrypted. Pass the password as ?p=YOUR_PASSWORD',
      { status: 401, headers: { 'Content-Type': 'text/plain' } },
    )
  }

  try {
    const text = await result.decrypt(p)
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch {
    return new Response('Wrong password or corrupted data.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
