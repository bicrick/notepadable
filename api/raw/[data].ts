import type { VercelRequest, VercelResponse } from '@vercel/node'
import { decompressAuto } from '../../src/compression'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { data, p } = req.query

  if (!data || typeof data !== 'string') {
    return res.status(400).setHeader('Content-Type', 'text/plain').send('Missing data segment.')
  }

  let result
  try {
    result = decompressAuto(data)
  } catch {
    return res.status(400).setHeader('Content-Type', 'text/plain').send('Invalid or unrecognized data.')
  }

  if (!result.encrypted) {
    return res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .send(result.text)
  }

  // Encrypted content
  const password = typeof p === 'string' ? p : undefined

  if (!password) {
    return res
      .status(401)
      .setHeader('Content-Type', 'text/plain')
      .send('This document is encrypted. Pass the password as ?p=YOUR_PASSWORD')
  }

  try {
    const text = await result.decrypt(password)
    return res
      .status(200)
      .setHeader('Content-Type', 'text/plain; charset=utf-8')
      .send(text)
  } catch {
    return res
      .status(401)
      .setHeader('Content-Type', 'text/plain')
      .send('Wrong password or corrupted data.')
  }
}
