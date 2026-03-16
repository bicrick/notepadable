# Raw endpoint

Every `notepadable` link can also be read as plain text.

Take the encoded part after `#`, send it to `/raw/...`, and the server will return the decompressed note as `text/plain`.

```mermaid
flowchart LR
  A["Shareable note URL"] --> B["Encoded text in URL hash"]
  B --> C["Request /raw/{encoded-text}"]
  C --> D["Receive plain text response"]
```

## Try it

```bash
curl https://notepadable.com/raw/IAAAASAuAgYCQAWBIIQAEASACAMwGoDoA7AGIDqAFJACAGwBqAbgB4AMAYICGA-ANIAsAIUA
```