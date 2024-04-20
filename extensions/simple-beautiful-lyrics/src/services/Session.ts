import Cleanup from "./Cleanup";

const GlobalCleanup = new Cleanup();

// Store our current-script/style and handle other-scripts not existing
let Script: HTMLScriptElement;
let IsDevelopment = false;
{
    let productionScript: HTMLScriptElement | undefined;
    let developmentScript: HTMLScriptElement | undefined;

    for (const script of document.getElementsByTagName("script")) {
        if (script.src.includes("beautiful-lyrics.js")) {
            if (script.src.startsWith("https://xpui.app.spotify.com/")) {
                if (developmentScript === undefined) {
                    developmentScript = script;
                } else {
                    script.remove();
                }
            } else {
                if (productionScript === undefined) {
                    productionScript = script;
                } else {
                    script.remove();
                }
            }
        }
    }

    if (developmentScript === undefined) {
        Script = productionScript!;
    } else {
        IsDevelopment = true;

        if (productionScript !== undefined) {
            productionScript.remove();
        }

        Script = developmentScript;
    }
}

// Spotify Types
interface HistoryLocation {
    pathname: string;
    search: string;
    hash: string;
    state: Record<string, any>;
}

let AllSpicetifyLoaded = false;
let SpotifyPlayer = Spicetify.Player;
let SpotifyShowNotification = Spicetify.showNotification;
let SpotifyPlatform = Spicetify.Platform;
let SpotifyHistory: {
    push: (path: HistoryLocation | string) => void;
    replace: (path: HistoryLocation | string) => void;
    goBack: () => void;
    goForward: () => void;
    listen: (listener: (location: HistoryLocation) => void) => () => void;
    location: HistoryLocation;
    entries: HistoryLocation[];
} = SpotifyPlatform?.History;
let SpotifyPlaybar = Spicetify.Playbar;
let SpotifySnackbar = (Spicetify as any).Snackbar;

const WaitForSpicetify = () => {
    // Update our variables
    SpotifyPlayer = Spicetify.Player;
    SpotifyShowNotification = Spicetify.showNotification;
    SpotifyPlatform = Spicetify.Platform;
    SpotifyHistory = SpotifyPlatform?.History;
    SpotifyPlaybar = Spicetify.Playbar;
    SpotifySnackbar = (Spicetify as any).Snackbar;

    if (
        SpotifyPlayer !== undefined &&
        SpotifyShowNotification !== undefined &&
        SpotifyPlatform !== undefined &&
        SpotifyHistory !== undefined &&
        SpotifyPlaybar !== undefined &&
        SpotifySnackbar !== undefined
    ) {
        AllSpicetifyLoaded = true;
    }
};

export const ShowNotification = (html: string, variant: "info" | "success" | "warning" | "error" | "default", hideAfter: number) => {
    SpotifySnackbar.enqueueSnackbar(
        Spicetify.React.createElement("div", {
            dangerouslySetInnerHTML: {
                __html: html.trim()
            }
        }),
        {
            variant: variant,
            autoHideDuration: hideAfter * 1000
        }
    );
};

export const IsSpicetifyLoaded = () => AllSpicetifyLoaded || WaitForSpicetify();
export { GlobalCleanup, SpotifyPlayer, SpotifyHistory, SpotifyPlaybar, HistoryLocation, Script, IsDevelopment };
