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
        LyricClass: ["lyrics-lyricsContent-lyric", "BJ1zQ_ReY3QPaS7SW46s", "NiCdLCpp3o2z6nBrayOn"],
        UnsyncedLyricClass: ["lyrics-lyricsContent-unsynced", "SruqsAzX8rUtY2isUZDF", "HxblHEsl2WX2yhubfVIc"],
        HighlightedLyricClass: ["lyrics-lyricsContent-highlight", "aeO5D7ulxy19q4qNBrkk", "MEjuIn9iTBQbnCqHpkoQ"],
        ActiveLyricClass: ["lyrics-lyricsContent-active", "EhKgYshvOwpSrTv399Mw", "arY01KDGhWNgzlAHlhpd"]
    };

    private static SetIndexMap: Record<string, number> = {};
    private static SetIndexMapTries: Record<string, number> = {};
    private static SetIndexMapMaxTries = 1000;

    static findSetIndex(className: keyof typeof Spotify.ComponentClasses) {
        const classOptions = Spotify.ComponentClasses[className];

        for (let i = 0; i < classOptions.length; i++) {
            const element = document.body.querySelector(`.${classOptions[i]}`);
            if (element) {
                Spotify.SetIndexMap[className] = i;
                return;
            }
        }

        Spotify.SetIndexMapTries[className] = (Spotify.SetIndexMapTries[className] || 0) + 1;

        if (Spotify.SetIndexMapTries[className] >= Spotify.SetIndexMapMaxTries) {
            console.warn(`Failed to find class for ${className} after ${Spotify.SetIndexMapMaxTries} tries. Assuming default class.`);
            Spotify.SetIndexMap[className] = 0;
            return;
        }
    }

    // Function to get a component by class name
    static getComponent<T extends HTMLElement>(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body): T | null {
        if (Spotify.SetIndexMap[className] === undefined) {
            Spotify.findSetIndex(className);
        }

        if (Spotify.SetIndexMap[className] === undefined) {
            return null;
        }

        return body.querySelector<T>(`.${Spotify.ComponentClasses[className][Spotify.SetIndexMap[className]]}`);
    }

    // Function to check if the arrays match at any point
    static checkClassNamesMatch(classNames: DOMTokenList, componentKey: keyof typeof Spotify.ComponentClasses): boolean {
        if (Spotify.SetIndexMap[componentKey] === undefined) {
            Spotify.findSetIndex(componentKey);
        }

        if (Spotify.SetIndexMap[componentKey] === undefined) {
            return false;
        }

        const componentClassName = Spotify.ComponentClasses[componentKey][Spotify.SetIndexMap[componentKey]];
        return classNames.contains(componentClassName);
    }
}

export default Spotify;
