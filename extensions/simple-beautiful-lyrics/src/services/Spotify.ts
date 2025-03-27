// Definition of classnames used in the Spotify web player
// Used to find elements in the DOM
// These values are not guaranteed to be stable and may change with updates

class Spotify {
    // Enum for component classes to handle both raw and mapped class names
    // Order of class names: [Spicetify, Spotify Windows 10, Spotify Windows 11]
    static ComponentClasses = {
        // Background
        FullScreenLyricsBackgroundClass: ["lyrics-lyrics-background", "o4GE4jG5_QICak2JK_bn", "L9xhJOJnV2OL5Chm3Jew"],

        // Lyrics Container
        FullScreenLyricsContainerClass: ["lyrics-lyrics-contentWrapper", "_Wna90no0o0dta47Heiw", "esRByMgBY3TiENAsbDHA"],

        // Sidebar Lyrics Background
        SidebarLyricsBackgroundClass: ["main-nowPlayingView-lyricsGradient", "main-nowPlayingView-lyricsGradient", "main-nowPlayingView-lyricsGradient"],

        // Main Lyrics Container
        MainLyricsContainerClass: ["lyrics-lyrics-container", "tr8V5eHsUaIkOYVw7eSG", "FUYNhisXTCmbzt9IDxnT"],

        // Lyrics
        LyricClass: ["lyrics-lyricsContent-lyric", "nw6rbs8R08fpPn7RWW2w", "NiCdLCpp3o2z6nBrayOn"],
        UnsyncedLyricClass: ["lyrics-lyricsContent-unsynced", "SruqsAzX8rUtY2isUZDF", "HxblHEsl2WX2yhubfVIc"],
        HighlightedLyricClass: ["lyrics-lyricsContent-highlight", "aeO5D7ulxy19q4qNBrkk", "MEjuIn9iTBQbnCqHpkoQ"],
        ActiveLyricClass: ["lyrics-lyricsContent-active", "EhKgYshvOwpSrTv399Mw", "arY01KDGhWNgzlAHlhpd"]
    };

    private static SetIndex = -1;
    static findSetIndex(className: keyof typeof Spotify.ComponentClasses) {
        const classOptions = Spotify.ComponentClasses[className];

        for (let i = 0; i < classOptions.length; i++) {
            const element = document.body.querySelector(`.${classOptions[i]}`);
            if (element) {
                Spotify.SetIndex = i;
                return;
            }
        }
    }

    // Function to get a component by class name
    static getComponent<T extends HTMLElement>(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body): T | null {
        if (Spotify.SetIndex === -1) {
            Spotify.findSetIndex(className);
        }

        return body.querySelector<T>(`.${Spotify.ComponentClasses[className][Spotify.SetIndex]}`);
    }

    // Function to check if the arrays match at any point
    static checkClassNamesMatch(classNames: DOMTokenList, componentKey: keyof typeof Spotify.ComponentClasses): boolean {
        if (Spotify.SetIndex === -1) {
            Spotify.findSetIndex(componentKey);
        }

        const componentClassName = Spotify.ComponentClasses[componentKey][Spotify.SetIndex];
        return classNames.contains(componentClassName);
    }
}

export default Spotify;
