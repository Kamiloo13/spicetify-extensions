// Initial Services
// Comment this out in case of building the "local" version
import { HasDevInstance } from "./services/Session";
import { GlobalCleanup, IsSpicetifyLoaded } from "./services/Session";
import { Start as StartCoverArt } from "./services/CoverArt";
import { Start as StartCheckLyrics, CheckForLyricsContainers } from "./modules/LyricsContainer";
// import { Start as StartCheckContribute, CheckForContributeContainer } from "./modules/LyricsContribute";
import { CheckForLiveBackgrounds } from "./modules/LyricsBackground";
import Player from "./services/Player";
import Spotify from "./services/Spotify";

async function main() {
    // Comment this out in development mode or when using the local version
    if (HasDevInstance) return;

    while (!IsSpicetifyLoaded()) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // FIXME: Remove after a while
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics:cache-lyrics");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-endpoint");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-input-endpoint");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-token");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.api-token-input");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.cache-version");
    Spicetify.LocalStorage.remove("simple-beautiful-lyrics.enable-debug");
    // Announce that we are moving feat. to new extension
    // Check if the new extension is already installed && if user was using the old feature
    if (JSON.parse(Spicetify.LocalStorage.get("simple-beautiful-lyrics.override-fetch") || "{}")?.value == true && !Spicetify.LocalStorage.get("more-lyrics.cache-version")) {
        Spicetify.showNotification(
            'Simple Beautiful Lyrics: Feature adding more lyrics providers to Spotify page has been moved to "More Lyrics" extension.\nIf you still want to use this feature, please install the new extension from the marketplace.',
            false,
            10000
        );
        console.warn(
            'Simple Beautiful Lyrics: Feature adding more lyrics providers to Spotify page has been moved to "More Lyrics" extension. If you still want to use this feature, please install the new extension from the marketplace.'
        );
        console.warn("Simple Beautiful Lyrics: If you want to disable this message, please do: `Spicetify.LocalStorage.remove('simple-beautiful-lyrics.override-fetch')`");
    }

    StartCoverArt();
    Player.Start();

    const observer = GlobalCleanup.AddObserver(
        new MutationObserver(() => {
            const mainLyricsContainers = Spotify.getComponents<HTMLDivElement>("MainLyricsContainerClass", document.body);

            const mainLyricsContainer = mainLyricsContainers.length == 1 ? mainLyricsContainers[0] : mainLyricsContainers.length > 1 ? mainLyricsContainers[1] : null;
            CheckForLiveBackgrounds(mainLyricsContainer);
            CheckForLyricsContainers(mainLyricsContainer);
            // CheckForContributeContainer(mainLyricsContainer);
        })
    );

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    // Check for initial elements
    const mainLyricsContainers = Spotify.getComponents<HTMLDivElement>("MainLyricsContainerClass", document.body);
    const mainLyricsContainer = mainLyricsContainers.length == 1 ? mainLyricsContainers[0] : mainLyricsContainers.length > 1 ? mainLyricsContainers[1] : null;
    CheckForLiveBackgrounds(mainLyricsContainer);
    // CheckForContributeContainer(mainLyricsContainer);
    // StartCheckContribute(mainLyricsContainer);
    StartCheckLyrics(mainLyricsContainer);
}

export default main;
