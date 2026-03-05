const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(data: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  )

  const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength)
  result.set(salt, 0)
  result.set(iv, SALT_LENGTH)
  result.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH)
  return result
}

export async function decrypt(payload: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = payload.slice(0, SALT_LENGTH)
  const iv = payload.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = payload.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(password, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  )

  return new Uint8Array(plaintext)
}
