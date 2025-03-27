## Simple Beautiful Lyrics

<a href="https://github.com/Kamiloo13/spicetify-extensions"><img src="https://img.shields.io/github/stars/Kamiloo13/spicetify-extensions?style=social&amp;logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAAmJLR0QA/4ePzL8AAACpSURBVBgZBcErCsIAAADQl0SriL9q0uItFLtgsxl1WRCT+AG7sLpi9AYeY21F3QUmhm0w3wMANtYAAAAtma82AABw8fFxBgCAnkwgkOkCMBJ6equkGhpSlZen0JCpUiow0wEdM4FUaQILhSsAOCgtAeZyewBbuTkAPNwB3D0AgNhOzcpKzU4MAHWFSOLnJxEp1AEYq+Ru+vpucpUxAE1HAwADJ00AAAAAf0pmMuwUt9p+AAAAAElFTkSuQmCC" alt="stars - spicetify-extensions"></a>

Enhance your full-screen song lyrics experience with this simple theme for Spotify lyrics page.

<img src="./preview.gif" alt="Logo" width="300" height="275">

### Overview

**Simple Beautiful Lyrics** revamps the Spotify lyrics experience with a focus on simplicity and lightweight. It offers a dynamic background that changes based on the album cover of the current song. The lyrics are displayed in a clean and readable font with an aditional blur effect.

> **This project is a fork of a plugin made by [surfbryce](https://github.com/surfbryce) - [Beautiful Lyrics](https://github.com/surfbryce/beautiful-lyrics)**
> Please check out the original project for even more features. This fork mainly focuses on being lightweight with minimal external packages and APIs.

### Settings

> Click on **Profile Pic > Settings > Simple Beautiful Lyrics**

| Type     | Description                                                                            | Default State                     |
| -------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| ⚙️Toggle | Overrides Spotify's `fetch` function to enable searching for alternative lyric sources | ✅ On                             |
| 📝Text   | API Endpoint                                                                           | `https://lyrics.kamiloo13.me/api` |
| ⚙️Toggle | Enables Debbuging                                                                      | ❌ Off                            |
| 📩Button | Clear cache                                                                            | -                                 |

### Contributing

Found a bug or have an idea? Feel free to submit an issue or a pull request!

> Starting from **version 1.2**, you'll have the ability to directly contribute to the project by adding missing lyrics.
>
> If you know any lyrics providers that offer a **free API**, feel free to submit a issue with the details. I'll be happy to add it to the extension.

### Changelog

<details open>
    <summary><b>Version 1.2</b></summary>

    - Added settings package (spcr-settings) and modified it
    - Added support for third-party lyrics provider (https://lrclib.net/)
    - Added cache system for lyrics (both on server and client side)
    - Added support for custom API endpoints
    - Added support for debugging
    - Added support for clearing cache

    TODO:
    - Add ability to contribute to the project by adding missing lyrics

</details>

<details open>
    <summary><b>Version 1.1</b></summary>

    - Initial release
    - Bug fixes, optimizations and style improvements
    - Autoupdater removed
    - Added NowPlaying siderbar support

</details>
