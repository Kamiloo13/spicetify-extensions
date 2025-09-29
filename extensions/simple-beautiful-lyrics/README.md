## Simple Beautiful Lyrics

<a href="https://github.com/Kamiloo13/spicetify-extensions"><img src="https://img.shields.io/github/stars/Kamiloo13/spicetify-extensions?style=social&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAAmJLR0QA/4ePzL8AAACpSURBVBgZBcErCsIAAADQl0SriL9q0uItFLtgsxl1WRCT+AG7sLpi9AYeY21F3QUmhm0w3wMANtYAAAAtma82AABw8fFxBgCAnkwgkOkCMBJ6equkGhpSlZen0JCpUiow0wEdM4FUaQILhSsAOCgtAeZyewBbuTkAPNwB3D0AgNhOzcpKzU4MAHWFSOLnJxEp1AEYq+Ru+vpucpUxAE1HAwADJ00AAAAAf0pmMuwUt9p+AAAAAElFTkSuQmCC" alt="stars - spicetify-extensions"></a>

> If you’d like to go beyond Spotify’s built-in lyrics support, check out my other extension **[More Lyrics](https://github.com/Kamiloo13/spicetify-extensions)**. It seamlessly integrates with the native Spotify Lyrics Page and adds additional providers like **[lrclib.net](https://lrclib.net/)** and **[lyrics.ovh](https://lyrics.ovh/)**, giving you access to a wider range of lyrics when the default source (Musixmatch) fails.

### Overview

**Simple Beautiful Lyrics** revamps the Spotify lyrics experience with a focus on simplicity and lightweight. It offers a dynamic background that changes based on the album cover of the current song. The lyrics are displayed in a clean and readable font with an aditional blur effect.

<img src="./preview.gif" alt="Logo" width="360" height="330">

> **This project is a fork of a plugin made by [surfbryce](https://github.com/surfbryce) - [Beautiful Lyrics](https://github.com/surfbryce/beautiful-lyrics)**
> Please check out the original project for even more features. This fork mainly focuses on being lightweight with minimal external packages and APIs.

### Installation (Local)

1. Run `spicetify config-dir` via command prompt.
1. Download `simple-beautiful-lyrics.js` from [extensions/simple-beautiful-lyrics/local/simple-beautiful-lyrics.js](https://github.com/Kamiloo13/spicetify-extensions/blob/main/extensions/simple-beautiful-lyrics/local/simple-beautiful-lyrics.js) and place it in `/Extensions`.
1. Run `spicetify config extensions simple-beautiful-lyrics.js & spicetify apply`

⚠ **Warning:** This version won't auto-update and may break in the future. If you want to use a simple auto-updater, save the following code snippet as, for example, `simple-beautiful-lyrics-updater.js` and follow the installation steps above **(skip 2 step)**, but with the modified name.

```js
(() => {
    const themeScript = document.createElement("script");
    themeScript.defer = true;
    themeScript.src = "https://cdn.jsdelivr.net/gh/Kamiloo13/spicetify-extensions@latest/extensions/simple-beautiful-lyrics/local/simple-beautiful-lyrics.js";
    document.body.appendChild(themeScript);
})();
```

### Contributing

Found a bug or have an idea? Feel free to submit an issue or a pull request!

### Changelog

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
