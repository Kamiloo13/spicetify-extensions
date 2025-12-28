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
