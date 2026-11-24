## Simple Beautiful Lyrics

<a href="https://github.com/Kamiloo13/spicetify-extensions"><img src="https://img.shields.io/github/stars/Kamiloo13/spicetify-extensions?style=social&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAAmJLR0QA/4ePzL8AAACpSURBVBgZBcErCsIAAADQl0SriL9q0uItFLtgsxl1WRCT+AG7sLpi9AYeY21F3QUmhm0w3wMANtYAAAAtma82AABw8fFxBgCAnkwgkOkCMBJ6equkGhpSlZen0JCpUiow0wEdM4FUaQILhSsAOCgtAeZyewBbuTkAPNwB3D0AgNhOzcpKzU4MAHWFSOLnJxEp1AEYq+Ru+vpucpUxAE1HAwADJ00AAAAAf0pmMuwUt9p+AAAAAElFTkSuQmCC" alt="stars - spicetify-extensions"></a>

> If you’d like to go beyond Spotify’s built-in lyrics support, check out my other extension **[More Lyrics](https://github.com/Kamiloo13/spicetify-extensions)**. It seamlessly integrates with the native Spotify Lyrics Page and adds additional providers like **[lrclib.net](https://lrclib.net/)** and **[lyrics.ovh](https://lyrics.ovh/)**, giving you access to a wider range of lyrics when the default source (Musixmatch) fails.

### Overview

**Simple Beautiful Lyrics** revamps the Spotify lyrics experience with a focus on simplicity and lightweight. It offers a dynamic background that changes based on the album cover of the current song. The lyrics are displayed in a clean and readable font with an additional blur effect.

- Animated background built from the blurred cover art (page view and cinema mode)
- Lines further away from the current one are blurred, the current line is slightly larger
- Survives Spotify updates: no hard-coded Spotify class names (see [How it works](#how-it-works))

<img src="./preview.gif" alt="Logo" width="360" height="330">

> **This project is a fork of a plugin made by [surfbryce](https://github.com/surfbryce) - [Beautiful Lyrics](https://github.com/surfbryce/beautiful-lyrics)**
> Please check out the original project for even more features. This fork mainly focuses on being lightweight with minimal external packages and APIs.

### Installation (Marketplace)

Search for **Simple Beautiful Lyrics** in the [Spicetify Marketplace](https://github.com/spicetify/marketplace) and click install.

### Installation (Local)

1. Run `spicetify config-dir` via command prompt.
1. Download `simple-beautiful-lyrics.js` from [extensions/simple-beautiful-lyrics/dist/simple-beautiful-lyrics.js](https://github.com/Kamiloo13/spicetify-extensions/blob/main/extensions/simple-beautiful-lyrics/dist/simple-beautiful-lyrics.js) and place it in `/Extensions`.
1. Run `spicetify config extensions simple-beautiful-lyrics.js & spicetify apply`

⚠ **Warning:** This version won't auto-update and may break in the future. If you want to use a simple auto-updater, save the following code snippet as, for example, `simple-beautiful-lyrics-updater.js` and follow the installation steps above **(skip 2 step)**, but with the modified name.

```js
(() => {
    const themeScript = document.createElement("script");
    themeScript.defer = true;
    themeScript.src = "https://cdn.jsdelivr.net/gh/Kamiloo13/spicetify-extensions@latest/extensions/simple-beautiful-lyrics/dist/simple-beautiful-lyrics.js";
    document.body.appendChild(themeScript);
})();
```

ℹ️ The Marketplace and the local install use the same file. You can keep both installed - the local copy always takes precedence and the Marketplace copy stays idle (see [How it works](#how-it-works)).

### Troubleshooting

The extension adds a **Simple Beautiful Lyrics** submenu to the Spicetify profile menu:

- **Fix lyrics detection (pick a line)** - if the lyrics stop being styled after a Spotify update, choose this and click any lyrics line.
- **Reset learned line classes** - forgets everything learned for the current Spotify version.
- **Copy diagnostics** - copies a JSON report about what the extension detected. Please attach it when reporting a bug.

The same report is available in DevTools (`spicetify enable-devtools`) via `SimpleBeautifulLyrics.diagnose()`.
Verbose logging can be enabled with `localStorage.setItem("sbl:debug", "1")` (remove the key to disable it).

### How it works

**Finding the lyrics.** Spotify uses hashed CSS class names that change with almost every client update, and Spicetify's class map only covers part of them. Instead of hard-coding them, the extension finds the lyrics by structure that does not change:

- the lyrics container declares the lyrics colours as inline CSS variables (`--lyrics-color-active: …`),
- Spotify's own background layer is the first (empty) child of that container,
- every lyric line is a `<div dir="auto">`; their common parent holds the lines,
- cinema mode lives in `.Root__cinema-view`, the page view has a `.before-scroll-node` element.

**Line states.** The only thing that still needs Spotify's classes is telling the active, sung and upcoming lines apart. The extension reads it from the class layout: exactly one line has a class no other line has (active), every line before it shares one class (sung) and every line after it shares another one (upcoming). The detected classes are cached per Spotify version in `localStorage`, so a new Spotify version is picked up automatically - no extension update needed.

**Styling.** Managed elements get our own attributes (`data-sbl-line`, `data-sbl-state`, `data-sbl-content`, `data-sbl-spotify-background`, `data-sbl-fade`) and the stylesheet only targets those.

**Local vs. Marketplace.** Every copy detects where it was loaded from (the local Spicetify folder is served from `https://xpui.app.spotify.com/`, the Marketplace one from a CDN). A local copy always wins; between two copies of the same kind, the first one to start wins. The running copy is exposed as `window.SimpleBeautifulLyrics`.

### Development

```bash
npm run build        # build into the Spicetify Extensions folder (then run `spicetify apply`)
npm run watch        # rebuild on change
npm run build-local  # minified build into dist/ (Marketplace) and local/ (same file)
npm run lint
```

Source layout (`src/`):

| Folder      | Contents                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `core/`     | instance handling, logging, cleanup scopes, signals, Spicetify helpers                         |
| `dom/`      | finding the lyrics elements, line-state inference, learned line classes                        |
| `features/` | cover art, animated background, lyrics effects, profile menu                                   |
| `styles/`   | stylesheets (only target our own `data-sbl-*` attributes and `sbl-*` classes)                  |

### Contributing

Found a bug or have an idea? Feel free to submit an issue or a pull request!

### Changelog

<details open>
    <summary><b>Version 1.4</b></summary>

    - Rewritten from scratch with a cleaner structure and documented code
    - No more hard-coded Spotify class names: lyrics are found by structure and line states are learned per Spotify version, so Spotify updates no longer require an extension update
    - One build for the Marketplace and local installs; a local copy automatically takes precedence
    - New profile menu: fix lyrics detection (pick a line), reset learned classes, copy diagnostics
    - Cinema mode: Spotify's gradient layers are detected by structure instead of class names
    - Better performance: page checks are batched per animation frame and only changed lines are restyled
    - Removed the custom lyrics font (its host no longer exists)
    - Styling now applies only to the main lyrics view (the sidebar keeps Spotify's default look)

</details>

<details open>
    <summary><b>Version 1.3</b></summary>
    
    - Moved fetch logic for additional lyrics providers to separate extension `More Lyrics`
    - Removed settings package

</details>

<details open>
    <summary><b>Version 1.2</b></summary>

    - Added settings package (spcr-settings) and modified it
    - Added support for third-party lyrics provider (https://lrclib.net/)
    - Added cache system for lyrics (both on server and client side)
    - Added support for custom API endpoints
    - Added support for debugging
    - Added support for clearing cache

</details>

<details open>
    <summary><b>Version 1.1</b></summary>

    - Initial release
    - Bug fixes, optimizations and style improvements
    - Autoupdater removed
    - Added NowPlaying siderbar support

</details>
