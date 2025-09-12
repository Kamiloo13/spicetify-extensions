// Definition of classnames used in the Spotify web player
// Used to find elements in the DOM
// These values are not guaranteed to be stable and may change with updates

class Spotify {
    // Enum for component classes to handle both raw and mapped class names
    // Order of class names: [Spicetify, Spotify Windows 10, Spotify Windows 11]
    static ComponentClasses = {
        // Background
        FullScreenLyricsBackgroundClass: ["lyrics-lyrics-background", "RFThkjLuWfPUO9shrMOZ"],

        // Lyrics Container
        FullScreenLyricsContainerClass: ["lyrics-lyrics-contentWrapper", "t_dtt9KL1wnNRvRO_y5L"],

        // Sidebar Lyrics Background
        SidebarLyricsBackgroundClass: ["main-nowPlayingView-lyricsGradient"],

        // Main Lyrics Container
        MainLyricsContainerClass: ["lyrics-lyrics-container", "lofIAg8Ixko3mfBrbfej"],

        // Cinema Mode
        CinemaModeBackgroundToRemove: ["x81eiLoZ5zWkSS1y28Oj"],
        CinemaModeContainerToInjectBackground: ["x0lJCeJrx_56dJTWdATl"],

        // Lyrics
        LyricClass: ["lyrics-lyricsContent-lyric", "o69qODXrbOkf6Tv7fa51"],
        UnsyncedLyricClass: ["lyrics-lyricsContent-unsynced", "eTLjCqbDo7QehPEPz86a"],
        HighlightedLyricClass: ["lyrics-lyricsContent-highlight", "ve52ddYhoAd3Xf27Zxfm"],
        ActiveLyricClass: ["lyrics-lyricsContent-active", "_gZrl2ExJwyxPy1pEUG2"]
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

    // Function to get a components by class name
    static getComponents<T extends HTMLElement>(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body): NodeListOf<T> {
        if (Spotify.SetIndexMap[className] === undefined) {
            Spotify.findSetIndex(className);
        }

        if (Spotify.SetIndexMap[className] === undefined) {
            return document.createDocumentFragment().childNodes as NodeListOf<T>; // Return empty NodeList
        }

        return body.querySelectorAll<T>(`.${Spotify.ComponentClasses[className][Spotify.SetIndexMap[className]]}`);
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
