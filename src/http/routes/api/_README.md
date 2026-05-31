These are authenticated API routes.

Authentication is handled by Authwall before these handlers run. API clients
may use a personal access token provided by Authwall:

```text
Authentication: Bearer pat_xxx
```

The current user comes from `req.user`; requests without a user receive
`401 Authentication is required`.

Implemented routes:

```text
GET    /api/v1/collections
POST   /api/v1/collections
GET    /api/v1/collections/:collection_uid
PATCH  /api/v1/collections/:collection_uid
DELETE /api/v1/collections/:collection_uid
```

Collections are scoped to the current user.

`GET /api/v1/collections` is paginated. Query params: `limit` (1–100,
default 50) and `offset` (default 0). Response shape:

```json
{
  "items": [
    {
      "uid": "col_mrybsue3nr4xbadrrhgmxwmi",
      "label": "Work links",
      "created_at": "2026-05-25T10:30:00.000Z",
      "updated_at": "2026-05-25T10:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

Fetch, create, and patch return a flat collection object:

```json
{
  "uid": "col_mrybsue3nr4xbadrrhgmxwmi",
  "label": "Work links",
  "contents": "% design: basic\n\nGitHub https://github.com",
  "created_at": "2026-05-25T10:30:00.000Z",
  "updated_at": "2026-05-25T10:30:00.000Z"
}
```

Create body (all fields optional):

```json
{
  "label": "Work links",
  "contents": "% design: basic\n\nGitHub https://github.com"
}
```

Patch body accepts either or both fields:

```json
{
  "label": "Renamed links",
  "contents": "% design: basic\n\nDocs https://example.com/docs"
}
```

## WebSocket notifications

Live notifications of mutations to the current user's collections.

```text
GET wss://navplace.com/api/v1/notifications
```

Authentication is identical to the REST routes — Authwall populates
`X-Auth-User` before the upgrade reaches the app. Requests without a user
receive `401 Unauthorized` and the socket is closed.

Every event has the same envelope. `time` is the event timestamp.

```json
{
  "type": "collection.updated",
  "value": { "uid": "...", "label": "...", "created_at": "...", "updated_at": "..." },
  "time": "2026-05-25T10:30:00.000Z"
}
```

Event types:

| `type`                 | `value`                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `hello`                | `null` (sent once on connect)                                 |
| `collection.created`   | `{uid, label, created_at, updated_at}`                        |
| `collection.updated`   | `{uid, label, created_at, updated_at}`                        |
| `collection.deleted`   | `{uid, label}`                                                |

Mutations include only the summary fields. Clients that need `contents`
should re-fetch via `GET /api/v1/collections/{uid}`.

The server pings every 30 s; clients that miss two consecutive pongs are
terminated. Clients should reconnect with backoff.

Notifications are in-memory, single-process. Events emitted on one Node
process are not visible to clients connected to a different process.

Sample browser client:

```js
const ws = new WebSocket('wss://navplace.com/api/v1/notifications');
ws.onmessage = (event) => {
    const {type, value, time} = JSON.parse(event.data);
    console.log(type, value, time);
};
```
