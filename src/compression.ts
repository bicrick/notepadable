import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { DICTIONARY, WORD_TO_INDEX } from './dictionary'

const VERSION = 1
const DICT_BITS = 12

// Binary token types
const TOKEN_WORD = 0    // 1-bit flag (0) + 12-bit dictionary index
const TOKEN_LITERAL = 1 // 1-bit flag (1) + 8-bit length + raw bytes

class BitWriter {
  private bytes: number[] = []
  private current = 0
  private bitPos = 0

  writeBits(value: number, count: number) {
    for (let i = count - 1; i >= 0; i--) {
      this.current = (this.current << 1) | ((value >> i) & 1)
      this.bitPos++
      if (this.bitPos === 8) {
        this.bytes.push(this.current)
        this.current = 0
        this.bitPos = 0
      }
    }
  }

  flush(): Uint8Array {
    if (this.bitPos > 0) {
      this.bytes.push(this.current << (8 - this.bitPos))
    }
    return new Uint8Array(this.bytes)
  }
}

class BitReader {
  private data: Uint8Array
  private bytePos = 0
  private bitPos = 0

  constructor(data: Uint8Array) {
    this.data = data
  }

  readBits(count: number): number {
    let value = 0
    for (let i = 0; i < count; i++) {
      if (this.bytePos >= this.data.length) return -1
      const bit = (this.data[this.bytePos] >> (7 - this.bitPos)) & 1
      value = (value << 1) | bit
      this.bitPos++
      if (this.bitPos === 8) {
        this.bitPos = 0
        this.bytePos++
      }
    }
    return value
  }

  hasMore(): boolean {
    return this.bytePos < this.data.length
  }
}

function tokenize(text: string): string[] {
  const tokens: string[] = []
  const re = /([a-zA-Z]+)|([^a-zA-Z]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

function dictEncode(text: string): Uint8Array {
  const tokens = tokenize(text)
  const writer = new BitWriter()

  for (const token of tokens) {
    const lower = token.toLowerCase()
    const index = WORD_TO_INDEX.get(lower)

    if (index !== undefined && token === lower) {
      writer.writeBits(TOKEN_WORD, 1)
      writer.writeBits(index, DICT_BITS)
    } else if (index !== undefined) {
      // Capitalized or mixed-case version of a dictionary word
      // Use a special flag: 1 (literal flag) + 0x00 length = "capitalized dict word"
      // Then encode case pattern + index
      if (token === token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()) {
        // Title case -- common enough to optimize
        writer.writeBits(TOKEN_LITERAL, 1)
        writer.writeBits(0, 8) // length=0 signals "title-case dict word"
        writer.writeBits(index, DICT_BITS)
      } else {
        // Unusual casing -- fall through to literal
        writeLiteral(writer, token)
      }
    } else {
      writeLiteral(writer, token)
    }
  }

  return writer.flush()
}

function writeLiteral(writer: BitWriter, text: string) {
  const bytes = new TextEncoder().encode(text)
  // Chunk into segments of 255 bytes max
  for (let offset = 0; offset < bytes.length; offset += 255) {
    const chunk = bytes.slice(offset, Math.min(offset + 255, bytes.length))
    writer.writeBits(TOKEN_LITERAL, 1)
    writer.writeBits(chunk.length, 8)
    for (const b of chunk) {
      writer.writeBits(b, 8)
    }
  }
}

function dictDecode(data: Uint8Array): string {
  const reader = new BitReader(data)
  const parts: string[] = []

  while (reader.hasMore()) {
    const flag = reader.readBits(1)
    if (flag === -1) break

    if (flag === TOKEN_WORD) {
      const index = reader.readBits(DICT_BITS)
      if (index === -1 || index >= DICTIONARY.length) break
      parts.push(DICTIONARY[index])
    } else {
      const length = reader.readBits(8)
      if (length === -1) break

      if (length === 0) {
        // Title-case dictionary word
        const index = reader.readBits(DICT_BITS)
        if (index === -1 || index >= DICTIONARY.length) break
        const word = DICTIONARY[index]
        parts.push(word.charAt(0).toUpperCase() + word.slice(1))
      } else {
        const bytes = new Uint8Array(length)
        for (let i = 0; i < length; i++) {
          const b = reader.readBits(8)
          if (b === -1) break
          bytes[i] = b
        }
        parts.push(new TextDecoder().decode(bytes))
      }
    }
  }

  return parts.join('')
}

export function compress(text: string): string {
  if (!text) return ''

  const dictEncoded = dictEncode(text)

  // Prepend version byte
  const payload = new Uint8Array(1 + dictEncoded.length)
  payload[0] = VERSION
  payload.set(dictEncoded, 1)

  // Convert to string for lz-string (binary string approach)
  let binaryStr = ''
  for (const b of payload) {
    binaryStr += String.fromCharCode(b)
  }

  return compressToEncodedURIComponent(binaryStr)
}

export function decompress(hash: string): string {
  if (!hash) return ''

  const binaryStr = decompressFromEncodedURIComponent(hash)
  if (!binaryStr) return ''

  const payload = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    payload[i] = binaryStr.charCodeAt(i)
  }

  const version = payload[0]
  if (version !== VERSION) {
    throw new Error(`Unknown compression version: ${version}`)
  }

  return dictDecode(payload.slice(1))
}
