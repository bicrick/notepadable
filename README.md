# Text Area

A minimalist text editor that encodes your entire document into the URL. No server, no database, no accounts -- just share a link and the recipient gets your full text.

Built with TypeScript, CodeMirror 6, and a custom hybrid compression pipeline that squeezes roughly 2x more text into a URL than standard deflate + base64.

## How it works

Everything you type is compressed and stored in the URL hash fragment (`#`). The hash never hits the server -- the static HTML/JS decompresses it client-side. This means:

- Share a link and the recipient sees exactly what you wrote
- Your text never touches a server
- Works offline as a PWA
- Deploy anywhere that serves static files

## Compression

The app uses a hybrid compression pipeline:

1. **Dictionary encoding** -- The 4,096 most common English words (from [Google's Trillion Word Corpus](https://github.com/first20hours/google-10000-english)) are mapped to 12-bit indices. Since these words cover ~95% of typical English prose, most of your text compresses dramatically before general-purpose compression even begins.

2. **lz-string** -- The dictionary-encoded binary output is further compressed with [lz-string](https://github.com/pieroxy/lz-string), which is optimized for short strings and URL-safe output.

The result: roughly 600-1,200 words fit in a 2,000-character URL (the universal safe limit for sharing across platforms).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy that folder to Vercel, Netlify, Cloudflare Pages, or any static host.

## Inspired by

[textarea.my](https://github.com/antonmedv/textarea) by Anton Medvedev -- a beautifully simple text editor that stores content in the URL hash. This project takes the same core idea and rebuilds it with better compression and a modern editor.
