// Definition of classnames used in the Spotify web player
// Used to find elements in the DOM
// These values are not guaranteed to be stable and may change with updates

class Spotify {
    // Enum for component classes to handle both raw and mapped class names
    static readonly ComponentClasses = {
        // Background
        FullScreenLyricsBackgroundClass: ["lyrics-lyrics-background", "RFThkjLuWfPUO9shrMOZ"],

        // Lyrics Container
        FullScreenLyricsContainerClass: ["lyrics-lyrics-contentWrapper", "t_dtt9KL1wnNRvRO_y5L"],

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

    // Precompiled selectors for each component class (fewer allocations)
    private static readonly ComponentSelectors: Record<string, string> = Object.fromEntries(
        Object.entries(Spotify.ComponentClasses).map(([key, classes]) => [key, classes.map((cls) => `.${cls}`).join(", ")])
    );
    private static SetIndexMap: Record<string, number> = {};
    private static ElementCache: Record<string, HTMLElement | null> = {};
    private static SetIndexMapTries: Record<string, number> = {};
    private static readonly MaxTries = 1000;

    static findSetIndex(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body) {
        const classOptions = Spotify.ComponentClasses[className];
        if (!classOptions?.length) return;

        if (classOptions.length === 1) {
            Spotify.SetIndexMap[className] = 0;
            return;
        }

        const element = body.querySelector(Spotify.ComponentSelectors[className]);
        if (element) {
            const foundClass = classOptions.findIndex((cls) => element.classList.contains(cls));
            if (foundClass !== -1) {
                Spotify.SetIndexMap[className] = foundClass;
                Spotify.ElementCache[className] = element as HTMLElement;
                return;
            }
        }

        const tries = (Spotify.SetIndexMapTries[className] ?? 0) + 1;
        Spotify.SetIndexMapTries[className] = tries;
        if (tries >= Spotify.MaxTries) {
            console.warn(`[SBL]: Failed to find class for ${className} after ${Spotify.MaxTries} tries. Assuming default class.`);
            Spotify.SetIndexMap[className] = 0;
        }
    }

    // Function to get a component by class name
    static getComponent<T extends HTMLElement>(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body): T | null {
        const cached = Spotify.ElementCache[className];
        if (cached && body.contains(cached)) return cached as T;

        if (Spotify.SetIndexMap[className] === undefined) {
            Spotify.findSetIndex(className, body);

            if (Spotify.SetIndexMap[className] === undefined) return null;
        }

        const element = body.querySelector<T>(`.${Spotify.ComponentClasses[className][Spotify.SetIndexMap[className]]}`);
        Spotify.ElementCache[className] = element;
        return element;
    }

    // Function to get a components by class name
    static getComponents<T extends HTMLElement>(className: keyof typeof Spotify.ComponentClasses, body: HTMLElement = document.body): NodeListOf<T> {
        if (Spotify.SetIndexMap[className] === undefined) {
            Spotify.findSetIndex(className, body);

            if (Spotify.SetIndexMap[className] === undefined) return document.createDocumentFragment().childNodes as NodeListOf<T>; // Return empty NodeList
        }

        return body.querySelectorAll<T>(`.${Spotify.ComponentClasses[className][Spotify.SetIndexMap[className]]}`);
    }

    // Function to check if the arrays match at any point
    static checkClassNamesMatch(classNames: DOMTokenList, componentKey: keyof typeof Spotify.ComponentClasses): boolean {
        return Spotify.ComponentClasses[componentKey].some((cls) => classNames.contains(cls)); // Check if any of the class options match
    }
}

export default Spotify;
