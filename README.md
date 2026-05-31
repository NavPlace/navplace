Pick a design, paste your links, you're done!

NavPlace is a tool for organizing, navigating, and presenting your links from a single text-based source.

Primary goal:
- Navigate to the right place in a couple of keystrokes, dozens of times a day.

Secondary goal:
- Render the same behavior as widgets and web pages from the same file.

## Desktop settings

The Electron app uses `~/.navplace/settings.yaml` for user settings and secrets.
Copy the template at `src/electron/config/settings.example.yaml` to that path to
get started:

```yaml
personal_access_token: ""
collection_url: ""
events_url: ""
```

Leave these values empty to keep the current local behavior: the app reads
`~/.navplace/README.md`. Fill `collection_url` with the full collection API URL
to load that collection remotely. Fill `events_url` with the full events API
URL to refresh the desktop app after collection updates.

## Similar

- https://multy.me/
- https://linkcollect.io/
- https://chromewebstore.google.com/detail/linkcollect-save-share-bo/knekpacpcgkieomkhhngenjeeokddkif?hl=en

## Related

- https://www.youtube.com/shorts/dGFpXRBGzkc
