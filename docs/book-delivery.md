# Book delivery and regional fallback

GitHub remains the primary source of the public `bunko-books` repository.
The reader tries jsDelivr next and Bunko's owned cloud cache last. It downloads
sequentially, combines simultaneous requests for the same path, and briefly skips
a failing host for 60 seconds before trying GitHub first again. Account requests
and GitHub sign-in never pass through book mirrors.

Catalogs, chapters, covers, figures and dictionary shards use the same transport.
Headers have an eight-second deadline; an idle body has a twenty-second deadline.
Downloads are capped at 32 MiB. JSON, gzip and image responses receive basic format
checks; dictionary installation retains its full SHA-256 checks. A caller can
cancel without canceling another reader of the same in-progress file.

Books and dictionaries retain their existing on-device stores. Figures and covers
use a cache before the network; covers are capped at 200 entries. Visible images
load through one download path, avoiding a separate image request alongside the
offline download. Persistent cache failure does not prevent displaying an image.

## Owned cache

The public endpoint is `/bunko/books-cache/<allowed book path>` on Bunko's existing
cloud service. It serves only fixed paths in the public book repository, sends
no account credentials upstream and accepts GET/HEAD. It cannot proxy arbitrary
URLs, serve private documents or read account records. CORS permits public reads
without cookies. ETags allow conditional responses; the edge compresses text.

The cache has a separate SQLite file, a configurable byte budget, LRU eviction,
a physical database size bound, four concurrent origin fetches and eight active
responses. Concurrent misses for one path share an origin fetch. Hash-named
chapters/covers and versioned dictionary shards cache for 30 days; mutable
catalogs, metadata, legacy chapters and figures revalidate after five minutes.
A known upstream 404 removes the cached entry. Temporary failures can serve a
previous copy for at most one extra day, with a short client cache lifetime.

Enable through protected server configuration:

```json
{
  "bookMirror": {
    "enabled": true,
    "database": "/var/lib/bunko-discussions/books-cache.sqlite",
    "maxBytes": 268435456
  }
}
```

Deploy a qualified immutable server release and the matching `bunko.caddy`
snippet before publishing clients using the final fallback. Preserve the prior
release/config for rollback. No bulk mirror preload is required: bytes reach
the owned server only when a reader needs that fallback. The on-device cache
continues to support offline reading.

Tests cover host failure/cooldown, captive portals, shared cancellation, image
offline reuse, persistent cache eviction, mutable revalidation, bounded stale
responses, CORS/ETag/HEAD and private-route isolation. These do not constitute a
latency or availability measurement from mainland China.
