## More Lyrics

<a href="https://github.com/Kamiloo13/spicetify-extensions"><img src="https://img.shields.io/github/stars/Kamiloo13/spicetify-extensions?style=social&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAAmJLR0QA/4ePzL8AAACpSURBVBgZBcErCsIAAADQl0SriL9q0uItFLtgsxl1WRCT+AG7sLpi9AYeY21F3QUmhm0w3wMANtYAAAAtma82AABw8fFxBgCAnkwgkOkCMBJ6equkGhpSlZen0JCpUiow0wEdM4FUaQILhSsAOCgtAeZyewBbuTkAPNwB3D0AgNhOzcpKzU4MAHWFSOLnJxEp1AEYq+Ru+vpucpUxAE1HAwADJ00AAAAAf0pmMuwUt9p+AAAAAElFTkSuQmCC" alt="stars - spicetify-extensions"></a>

### Overview

**More Lyrics** enhances Spotify’s native Lyrics Page by adding extra lyrics providers.  
By default, it fetches lyrics from sources like **[lrclib.net](https://lrclib.net/)** and **[lyrics.ovh](https://lyrics.ovh/)**, giving you a much better chance of finding lyrics when Spotify’s partner (Musixmatch) doesn’t deliver.

The extension works by overriding Spotify’s `fetch` function. In case Musixmatch fails to provide lyrics, `More Lyrics` automatically queries the configured API endpoint to find lyrics in external sources. The results are stored in a local cache, which can hold up to 100 entries; when the cache is full, the oldest entry is removed to make room for new ones.

You can even host your own API or connect to other providers of your choice; giving you full control over where the lyrics come from and how they’re displayed.  
(Detailed API requirements are explained below)

---

### Settings

> Click on **Profile Pic > Settings > More Lyrics**

| Type     | Description                                                                            | Default State                     |
| -------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| ⚙️Toggle | Overrides Spotify's `fetch` function to enable searching for alternative lyric sources | ✅ On                             |
| 📝Text   | API Endpoint                                                                           | `https://lyrics.kamiloo13.me/api` |
| 📝Text   | Custom API Token (optional, bypasses rate limits)                                      | (empty)                           |
| ⚙️Toggle | Enables Debbuging                                                                      | ❌ Off                            |
| 📩Button | Clear local cache                                                                      | -                                 |

---

### Providers

The default API currently integrates:

-   **[LRCLIB](https://lrclib.net/)** → Provides community made synced and unsynced lyrics
-   **[lyrics.ovh](https://lyrics.ovh/)** → Backup provider for unsynced lyrics

My API includes a **caching system** to reduce load and speed up responses. Cached lyrics are stored for **1 day** before being refreshed.

> Know a free lyrics API worth adding? Open an issue with the details. I’d be happy to expand the list of supported providers!

### Custom API Endpoint

You can configure your own API endpoint.  
It will receive requests in this format (with `Authorization: Bearer <token>` header if `API Token` is specified):

```
/get?artist=<artist name>&track=<track title>&duration=<duration (seconds)>&album=<album name>&username=<Spotify Name/ID>
```

```json
{
    "lines": [
        {
            "startTimeMs": "15088", // 0 - in case of unsyced lyrics
            "words": "Easy now, break it out, put it all in the bag",
            "syllables": [],
            "endTimeMs": "0"
        }
        // ...
    ],
    "provider": "lrclib.net",
    "providerLyricsDisplayName": "LRCLib",
    "providerLyricsId": "18071917",
    "isSynced": true
}
```

### Contributing

Found a bug or have an idea? Feel free to submit an issue or a pull request!

> Future plans include a web-based editor for contributing lyrics directly to **LRCLIB**.

### Changelog

<details open>
    <summary><b>Version 1.0</b></summary>

    - Initial release
    - Migrated fetch logic from Simple Beautiful Lyrics for better accessibility

</details>
